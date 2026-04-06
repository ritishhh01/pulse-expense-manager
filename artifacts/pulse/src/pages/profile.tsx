import { useState } from "react";
import { Loader2, Check, Palette } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useActiveUser } from "@/hooks/use-active-user";
import { useClerk } from "@clerk/react";
const AVATAR_COLORS = [
  "#39FF14", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
  "#85C1E9", "#F1948A", "#82E0AA", "#F8C471", "#AED6F1",
];

export default function Profile() {
  const user = useActiveUser();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user.name);
  const [upiId, setUpiId] = useState(user.upiId || "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          upiId: upiId.trim() || null,
          avatarColor,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      queryClient.invalidateQueries();
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Profile" showBack backHref="/">
      <div className="max-w-md mx-auto pt-4 pb-32 space-y-6">
        {/* Avatar */}
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-all"
                style={{ backgroundColor: avatarColor }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border-2 border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow"
              >
                <Palette className="h-3.5 w-3.5" />
              </button>
            </div>

            {showColorPicker && (
              <div className="flex flex-wrap gap-2 justify-center">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setAvatarColor(color); setShowColorPicker(false); }}
                    className="h-8 w-8 rounded-full border-2 transition-transform active:scale-90"
                    style={{
                      backgroundColor: color,
                      borderColor: avatarColor === color ? "white" : "transparent",
                      transform: avatarColor === color ? "scale(1.15)" : undefined,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="text-center">
              <div className="font-semibold text-base">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-card/50 border-border/50 h-12 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">UPI ID</Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="bg-card/50 border-border/50 h-12 font-mono focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground">Used for settlement requests</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full h-12 rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-card/60 border-border/50">
          <CardContent className="p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full rounded-xl opacity-80 hover:opacity-100"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
