import type { Metadata } from "next";

import AdminDashboard from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Admin felület | CineSeat",
  description: "CineSeat filmek és vetítések adminisztrációja",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
