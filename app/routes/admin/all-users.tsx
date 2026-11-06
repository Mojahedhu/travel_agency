import { Header } from "../../../components";
import {
  ColumnDirective,
  GridComponent,
  ColumnsDirective,
  PagerComponent,
} from "@syncfusion/ej2-react-grids";

import { getAllUsers, getUser } from "../../appwrite/auth";
import type { Route } from "./+types/all-users";
import { cn, formatDate } from "../../lib/utils";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { useState } from "react";

export const clientLoader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser();
  if (!user) return redirect("/sign-in");
  if (user.status !== "admin") return redirect("/");
  const limit = 10;
  const url = new URL(request.url);
  const parsedPage = parseInt(url.searchParams.get("page") || "1", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const offset = (page - 1) * limit;
  const { users, total } = await getAllUsers(limit, offset);
  return { users, total, page };
};

const AllUsers = ({ loaderData }: Route.ComponentProps) => {
  const { users, page } = loaderData;

  const [currentPage, setCurrentPage] = useState(page);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.location.search = `?page=${page}`;
  };
  return (
    <main className="dashboard wrapper">
      <Header
        title="Manage Users"
        description="Filter, sort, and access detailed user profiles"
      />
      <GridComponent dataSource={users} gridLines="None">
        <ColumnsDirective>
          <ColumnDirective
            field="name"
            headerText="Name"
            width={200}
            textAlign="Left"
            template={({ name, imageUrl }: UserData) => (
              <div className="flex items-center gap-1.5 px-4">
                <img
                  alt=""
                  src={imageUrl}
                  className="aspect-square size-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
                <span>{name}</span>
              </div>
            )}
          />
          <ColumnDirective
            field="email"
            headerText="Email Address"
            width={200}
            textAlign="Left"
          />
          <ColumnDirective
            field="$createdAt"
            headerText="Date Joined"
            width={140}
            textAlign="Left"
            template={({ $createdAt }: { $createdAt: string }) =>
              formatDate($createdAt)
            }
          />
          <ColumnDirective
            field="status"
            headerText="Type"
            width={100}
            textAlign="Left"
            template={({ status }: UserData) => (
              <article
                className={cn(
                  "status-column",
                  status === "user" ? "bg-success-50" : "bg-light-300",
                )}
              >
                <div
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "user" ? "bg-success-500" : "bg-gray-500",
                  )}
                />
                <h3
                  className={cn(
                    "font-inter text-xs font-medium",
                    status === "user" ? "text-success-700" : "text-gray-500",
                  )}
                >
                  {status}
                </h3>
              </article>
            )}
          />
        </ColumnsDirective>
      </GridComponent>

      <PagerComponent
        totalRecordsCount={loaderData.total}
        currentPage={currentPage}
        pageSize={10}
        click={(args) => {
          handlePageChange(args.currentPage);
        }}
        cssClass="mb-4!"
      />
    </main>
  );
};

export default AllUsers;
