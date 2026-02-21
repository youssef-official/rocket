import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// GitHub OAuth: get auth URL
async function getGitHubAuthUrl(redirectUri: string): Promise<string> {
  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  if (!clientId) throw new Error("GITHUB_CLIENT_ID not configured");
  
  const state = crypto.randomUUID();
  const supabase = getSupabaseAdmin();
  await supabase.from("oauth_pkce_store").insert({ state, code_verifier: "github" });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// GitHub OAuth: exchange code for token
async function exchangeGitHubCode(code: string, state: string, redirectUri: string): Promise<{ token: string; username: string }> {
  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth not configured");

  const supabase = getSupabaseAdmin();
  
  // Verify state
  const { data: stored } = await supabase
    .from("oauth_pkce_store")
    .select("code_verifier")
    .eq("state", state)
    .single();
  
  if (!stored) throw new Error("Invalid or expired state");
  await supabase.from("oauth_pkce_store").delete().eq("state", state);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });

  if (!tokenRes.ok) throw new Error("Failed to exchange GitHub code");
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "Vivora-X" },
  });
  const userData = await userRes.json();

  return { token: tokenData.access_token, username: userData.login || "" };
}

// Create or get GitHub repo
async function createOrGetRepo(token: string, repoName: string): Promise<{ full_name: string; html_url: string; default_branch: string }> {
  // Try create
  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "Vivora-X" },
    body: JSON.stringify({ name: repoName, private: false, auto_init: true }),
  });

  if (createRes.ok) {
    const repo = await createRes.json();
    return { full_name: repo.full_name, html_url: repo.html_url, default_branch: repo.default_branch || "main" };
  }

  const err = await createRes.json();
  if (err.errors?.[0]?.message?.includes("already exists")) {
    const getRes = await fetch(`https://api.github.com/repos/${err.errors[0].message.split("'")[1] || ''}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Vivora-X" },
    });
    // Fallback: get user and repo
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Vivora-X" },
    });
    const user = await userRes.json();
    const repoRes = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "Vivora-X" },
    });
    if (repoRes.ok) {
      const repo = await repoRes.json();
      return { full_name: repo.full_name, html_url: repo.html_url, default_branch: repo.default_branch || "main" };
    }
  }

  throw new Error(`Failed to create repo: ${JSON.stringify(err)}`);
}

// Push files to GitHub repo using the Git Trees API
async function pushFilesToRepo(
  token: string,
  fullName: string,
  branch: string,
  files: Record<string, { content: string }>,
  commitMessage: string
): Promise<string> {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "Vivora-X" };

  // Get latest commit SHA
  const refRes = await fetch(`https://api.github.com/repos/${fullName}/git/ref/heads/${branch}`, { headers });
  let parentSha = "";
  let baseTreeSha = "";

  if (refRes.ok) {
    const refData = await refRes.json();
    parentSha = refData.object.sha;
    const commitRes = await fetch(`https://api.github.com/repos/${fullName}/git/commits/${parentSha}`, { headers });
    const commitData = await commitRes.json();
    baseTreeSha = commitData.tree.sha;
  }

  // Create blobs for each file
  const tree: { path: string; mode: string; type: string; sha: string }[] = [];
  for (const [path, file] of Object.entries(files)) {
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    const blobRes = await fetch(`https://api.github.com/repos/${fullName}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
    });
    if (!blobRes.ok) continue;
    const blob = await blobRes.json();
    tree.push({ path: cleanPath, mode: "100644", type: "blob", sha: blob.sha });
  }

  // Create tree
  const treeBody: any = { tree };
  if (baseTreeSha) treeBody.base_tree = baseTreeSha;
  const treeRes = await fetch(`https://api.github.com/repos/${fullName}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify(treeBody),
  });
  const treeData = await treeRes.json();

  // Create commit
  const commitBody: any = { message: commitMessage, tree: treeData.sha };
  if (parentSha) commitBody.parents = [parentSha];
  const newCommitRes = await fetch(`https://api.github.com/repos/${fullName}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify(commitBody),
  });
  const newCommit = await newCommitRes.json();

  // Update ref
  if (parentSha) {
    await fetch(`https://api.github.com/repos/${fullName}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommit.sha }),
    });
  } else {
    await fetch(`https://api.github.com/repos/${fullName}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommit.sha }),
    });
  }

  return newCommit.sha;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "get-auth-url") {
      const url = await getGitHubAuthUrl(body.redirectUri);
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange-code") {
      const result = await exchangeGitHubCode(body.code, body.state, body.redirectUri);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "push") {
      const { token: ghToken, repoName, files, commitMessage } = body;
      if (!ghToken || !repoName || !files) {
        return new Response(JSON.stringify({ error: "Missing token, repoName, or files" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const repo = await createOrGetRepo(ghToken, repoName);
      const sha = await pushFilesToRepo(ghToken, repo.full_name, repo.default_branch, files, commitMessage || "Update from Vivora X");

      return new Response(JSON.stringify({ 
        success: true, 
        repo_url: repo.html_url, 
        full_name: repo.full_name,
        commit_sha: sha 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("github-push error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
