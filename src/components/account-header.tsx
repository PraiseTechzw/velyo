import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/veylo-logo-header.png";
export function AccountHeader() {
  const queryClient = useQueryClient(); const navigate = useNavigate();
  async function signOut() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
  return <header className="border-b bg-background px-6 py-5"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><Link to="/"><img src={logo} alt="veylo" className="h-8 w-auto" /></Link><Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button></div></header>;
}