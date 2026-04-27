import { CreateProjectWizard } from "./project-wizard";

export default function NewProjectPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your product or organization. You can edit details later.
        </p>
      </div>
      <CreateProjectWizard />
    </main>
  );
}
