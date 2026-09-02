import { RoleChooser } from "@/components/auth/role-chooser";

// Sign-up starts with a role choice. Each actor then gets its own form under
// /register/<role>, because the fields differ per role (schooling for students,
// the child code for parents, admin verification for teachers).
export default function RegisterPage() {
  return <RoleChooser />;
}
