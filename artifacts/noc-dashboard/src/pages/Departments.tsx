import React, { useState } from "react";
import { 
  useListDepartments, 
  useCreateDepartment, 
  useUpdateDepartment, 
  useDeleteDepartment 
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Briefcase, Trash2, Edit2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Departments() {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  const { data: departments, isLoading } = useListDepartments();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      updateDepartment.mutate({ id: editingId, data }, {
        onSuccess: () => {
          toast({ title: "Department updated" });
          queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
          handleClose();
        }
      });
    } else {
      createDepartment.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Department created" });
          queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
          handleClose();
        }
      });
    }
  };

  const handleEdit = (d: any) => {
    setEditingId(d.id);
    form.reset({ name: d.name, description: d.description || "" });
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDepartment.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Department deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
        setDeleteId(null);
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    form.reset({ name: "", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Manage organization departments.</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" />
              NEW DEPARTMENT
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Department" : "New Department"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea className="min-h-[100px]" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createDepartment.isPending || updateDepartment.isPending}>
                    {(createDepartment.isPending || updateDepartment.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Department
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : departments?.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No departments found.</TableCell></TableRow>
            ) : (
              departments?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {d.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs">{d.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(d)} title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this department. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteDepartment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
