import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lock, Mail, User, LogOut, CheckCircle2, AlertTriangle, Fingerprint, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { UserProfile } from "../types";

interface SecurityAuthConsoleProps {
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  onLogoutSuccess: () => void;
  onShowMessage: (msg: string) => void;
}

export default function SecurityAuthConsole({
  currentUser,
  onLoginSuccess,
  onLogoutSuccess,
  onShowMessage,
}: SecurityAuthConsoleProps) {
  const [isLoginBlock, setIsLoginBlock] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Form states
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setErrorMsg(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = isLoginBlock ? "/api/auth/login" : "/api/auth/signup";
    const bodyPayload = isLoginBlock
      ? { email, password }
      : { email, password, name };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "A secure connection error occurred during authentication.");
      }

      onShowMessage(
        isLoginBlock
          ? `Authorization verified: Welcome back, ${data.user.name}!`
          : `Profile registration successful! Account created for ${data.user.name}.`
      );
      
      onLoginSuccess(data.user, data.token);
      clearForm();
    } catch (err: any) {
      setErrorMsg(err.message);
      onShowMessage(`Security Alert: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("aether_token");
    if (!token) return;

    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.warn("Server logout notification failed, purging local storage cleanly", e);
    } finally {
      onLogoutSuccess();
      onShowMessage("Active coordinator session safely terminated.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-xl font-mono text-zinc-100 font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <span>Aether Identity Shield</span>
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Secure Cryptographic Credential Management & Session Vault
          </p>
        </div>

        <div className="font-mono text-xs flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/40 border border-zinc-800">
          <Fingerprint className={`h-3.5 w-3.5 ${currentUser ? "text-indigo-400 animate-pulse" : "text-zinc-600"}`} />
          <span className="text-[10px] text-zinc-400 uppercase">
            {currentUser ? `Core State: Authenticated` : `Core State: Sealed`}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="auth-forms"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-12 gap-6"
          >
            {/* Left Description Column */}
            <div className="md:col-span-5 space-y-4 font-mono">
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/20 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                    Securing Your Matrix
                  </span>
                  <h3 className="text-sm font-bold text-zinc-200">Session Guard Protocol</h3>
                </div>
                
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Authenticating with the Aether Console permits modifying live ESP32 microchip telemetry frequency rates, generating bespoke corporate narrative achievements via Gemini AI modules, and pruning historic timeline records.
                </p>

                <div className="space-y-2 border-t border-zinc-900/60 pt-3 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500/80 shrink-0" />
                    <span>Salted PBKDF2 Hashed Passwords</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500/80 shrink-0" />
                    <span>Secure 256-bit Random Tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500/80 shrink-0" />
                    <span>Local State Encryption Layer</span>
                  </div>
                </div>
              </div>

              {/* Security Banner Alert */}
              <div className="p-4 rounded-xl border border-amber-900/30 bg-amber-950/10 text-[11px] leading-relaxed text-amber-500 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-0.5">Diagnostic Advisory</span>
                  Credentials are dynamically saved directly to your MongoDB Atlas cluster when configured. When offline, credentials seamlessly persist within secure localized JSON caches.
                </div>
              </div>
            </div>

            {/* Right Interactive Form Column */}
            <div className="md:col-span-7">
              <div className="rounded-xl border border-cosmic-border bg-cosmic-surface p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/3 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-5">
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {isLoginBlock ? "0x01 // SESSION SECURE SIGN-IN" : "0x02 // COGNITIVE ID SIGN-UP"}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsLoginBlock(true);
                        clearForm();
                      }}
                      className={`px-3 py-1 font-mono text-[10px] transition-all rounded cursor-pointer ${
                        isLoginBlock
                          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      LOG IN
                    </button>
                    <button
                      onClick={() => {
                        setIsLoginBlock(false);
                        clearForm();
                      }}
                      className={`px-3 py-1 font-mono text-[10px] transition-all rounded cursor-pointer ${
                        !isLoginBlock
                          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      SIGN UP
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-lg border border-red-900/30 bg-red-950/10 text-red-400 text-xs font-mono flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4 font-mono text-xs">
                  {!isLoginBlock && (
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-bold block">01 // FULL NAME</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full bg-cosmic-bg border border-zinc-900 rounded-lg py-2.5 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-indigo-500/60"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-bold block">
                      {isLoginBlock ? "01 // COGNITIVE PORT EMAIL" : "02 // COGNITIVE PORT EMAIL"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="coordinator@emergence.io"
                        className="w-full bg-cosmic-bg border border-zinc-900 rounded-lg py-2.5 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-indigo-500/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-bold block">
                      {isLoginBlock ? "02 // CRYPTOGRAPHIC KEYPHRASE" : "03 // CRYPTOGRAPHIC KEYPHRASE"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-cosmic-bg border border-zinc-900 rounded-lg py-2.5 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-indigo-500/60"
                      />
                    </div>
                    {!isLoginBlock && (
                      <p className="text-[10px] text-zinc-600">
                        Must be at least 6 characters in length to generate secure salt indices.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="h-4 w-4 animate-spin" />
                        <span>Verifying Decryption Stream...</span>
                      </span>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>{isLoginBlock ? "PROMPT SESSION LOG IN" : "BUILD ENCRYPTED IDENTITY PROFILE"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth-profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-12 gap-6 font-mono text-xs"
          >
            {/* Left Account Summary */}
            <div className="md:col-span-8 space-y-4">
              <div className="p-6 rounded-xl border border-cosmic-border bg-cosmic-surface space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3.5 border-b border-zinc-900/60 pb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200">{currentUser.name}</div>
                    <div className="text-[10px] text-zinc-500">{currentUser.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-zinc-950/20 border border-zinc-900/40 space-y-1">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Authorized Entity UUID</div>
                    <div className="text-[10px] font-bold text-zinc-300 select-all truncate">
                      {currentUser.id}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950/20 border border-zinc-900/40 space-y-1">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Signal Security Protocol</div>
                    <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>PBKDF2 Guard Verified</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950/25 border border-zinc-900 text-zinc-400 leading-relaxed text-[11px] space-y-1">
                  <span className="font-bold text-indigo-400 block uppercase text-[10px] tracking-wider mb-0.5">
                    Authorized Status Active
                  </span>
                  Your browser holds an active 256-bit secure cookie token for session identification. System action safeguards have resolved successfully. You can now publish segment translations, delete portfolio memories, and pulse hardware registers.
                </div>
              </div>
            </div>

            {/* Right Terminate Session Console */}
            <div className="md:col-span-4 space-y-4">
              <div className="p-6 rounded-xl border border-rose-950/30 bg-rose-950/5 space-y-4 font-mono text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2 animate-pulse">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-300">De-authenticate Session</h3>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Purges active bearer keys from memory cache, locking manual telemetry calibration variables.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-850/50 hover:border-rose-700 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{loading ? "Revoking Key..." : "Safely Log Out"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
