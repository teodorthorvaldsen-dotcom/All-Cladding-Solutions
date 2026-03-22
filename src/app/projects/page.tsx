import { redirect } from "next/navigation";

/** Former "Our Work" index — gallery now lives on /about. */
export default function ProjectsIndexRedirect() {
  redirect("/about");
}
