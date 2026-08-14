"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { roleDescriptions, users } from "@/lib/mock/settings";

export default function NutzerPage() {
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<keyof typeof roleDescriptions>(
    "Mitarbeiter",
  );
  const [email, setEmail] = React.useState("");

  return (
    <>
      <PageHeader
        title="Nutzer"
        lead="Wer was sehen darf. Die Küche lädt hoch und sieht keine Preise, die Kanzlei liest und ändert nichts."
      />

      <div className="mb-5 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus />
              Nutzer einladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nutzer einladen</DialogTitle>
              <DialogDescription>
                Die Einladung gilt 14 Tage. Ein Zugang für den Steuerberater ist
                kostenlos und immer nur lesend.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-Mail</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@betrieb.de"
                />
              </div>
              <div className="space-y-2">
                <Label>Rolle</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) =>
                    setRole(value as keyof typeof roleDescriptions)
                  }
                  className="gap-2"
                >
                  {(
                    Object.keys(roleDescriptions) as (keyof typeof roleDescriptions)[]
                  ).map((entry) => (
                    <Label
                      key={entry}
                      htmlFor={`role-${entry}`}
                      className="hover:bg-muted flex items-start gap-3 rounded-md border p-3 font-normal"
                    >
                      <RadioGroupItem
                        id={`role-${entry}`}
                        value={entry}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-medium">{entry}</span>
                        <span className="text-muted-foreground block text-sm">
                          {roleDescriptions[entry]}
                        </span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button
                disabled={!email.includes("@")}
                onClick={() => {
                  setOpen(false);
                  toast.success("Einladung versendet", {
                    description: `${email} kann sich als ${role} anmelden.`,
                  });
                  setEmail("");
                }}
              >
                Einladung senden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead className="hidden lg:table-cell">Standorte</TableHead>
                <TableHead className="text-right">Zuletzt aktiv</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {user.locations.join(", ")}
                  </TableCell>
                  <TableCell className="tabular text-right whitespace-nowrap">
                    {formatDate(user.lastSeen)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Was die Rollen dürfen</CardTitle>
          <CardDescription>
            Die Küche lädt hoch und sieht keine Preise — das ist Absicht.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(
            Object.keys(roleDescriptions) as (keyof typeof roleDescriptions)[]
          ).map((entry) => (
            <div key={entry} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <span className="w-32 shrink-0 font-medium">{entry}</span>
              <span className="text-muted-foreground">
                {roleDescriptions[entry]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
