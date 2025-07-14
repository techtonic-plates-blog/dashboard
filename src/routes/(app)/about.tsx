import DataTable from "~/components/ui/data-table"

// Sample data for demonstration - can be any type
interface Person {
  id: number
  name: string
  email: string
  role: string
  department: string
  status: "active" | "inactive" | "pending"
  salary: number
  joinDate: string
}

const sampleData: Person[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Developer",
    department: "Engineering",
    status: "active",
    salary: 75000,
    joinDate: "2023-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Designer",
    department: "Design",
    status: "active",
    salary: 68000,
    joinDate: "2023-02-20",
  },
  {
    id: 3,
    name: "Robert Johnson",
    email: "robert@example.com",
    role: "Manager",
    department: "Product",
    status: "inactive",
    salary: 85000,
    joinDate: "2022-11-10",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily@example.com",
    role: "Developer",
    department: "Engineering",
    status: "active",
    salary: 72000,
    joinDate: "2023-03-05",
  },
  {
    id: 5,
    name: "Michael Brown",
    email: "michael@example.com",
    role: "Marketing",
    department: "Marketing",
    status: "pending",
    salary: 58000,
    joinDate: "2023-04-12",
  },
  {
    id: 6,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "Designer",
    department: "Design",
    status: "active",
    salary: 71000,
    joinDate: "2023-01-28",
  },
  {
    id: 7,
    name: "David Thompson",
    email: "david@example.com",
    role: "Developer",
    department: "Engineering",
    status: "inactive",
    salary: 78000,
    joinDate: "2022-12-15",
  },
  {
    id: 8,
    name: "Jessica Lee",
    email: "jessica@example.com",
    role: "Manager",
    department: "Product",
    status: "active",
    salary: 92000,
    joinDate: "2022-10-20",
  },
  {
    id: 9,
    name: "Thomas Harris",
    email: "thomas@example.com",
    role: "Marketing",
    department: "Marketing",
    status: "pending",
    salary: 61000,
    joinDate: "2023-04-05",
  },
  {
    id: 10,
    name: "Lisa Garcia",
    email: "lisa@example.com",
    role: "Developer",
    department: "Engineering",
    status: "active",
    salary: 74000,
    joinDate: "2023-02-10",
  },
  {
    id: 11,
    name: "Christopher Martinez",
    email: "chris@example.com",
    role: "Designer",
    department: "Design",
    status: "active",
    salary: 69000,
    joinDate: "2023-03-15",
  },
  {
    id: 12,
    name: "Amanda Rodriguez",
    email: "amanda@example.com",
    role: "Manager",
    department: "Product",
    status: "active",
    salary: 88000,
    joinDate: "2022-11-25",
  },
  {
    id: 13,
    name: "Kevin Anderson",
    email: "kevin@example.com",
    role: "Developer",
    department: "Engineering",
    status: "pending",
    salary: 76000,
    joinDate: "2023-04-20",
  },
  {
    id: 14,
    name: "Michelle Taylor",
    email: "michelle@example.com",
    role: "Marketing",
    department: "Marketing",
    status: "active",
    salary: 63000,
    joinDate: "2023-01-10",
  },
  {
    id: 15,
    name: "Daniel White",
    email: "daniel@example.com",
    role: "Designer",
    department: "Design",
    status: "inactive",
    salary: 67000,
    joinDate: "2022-12-05",
  },
  {
    id: 16,
    name: "Rachel Green",
    email: "rachel@example.com",
    role: "Developer",
    department: "Engineering",
    status: "active",
    salary: 79000,
    joinDate: "2023-02-28",
  },
  {
    id: 17,
    name: "Mark Johnson",
    email: "mark@example.com",
    role: "Manager",
    department: "Product",
    status: "active",
    salary: 95000,
    joinDate: "2022-09-15",
  },
  {
    id: 18,
    name: "Jennifer Davis",
    email: "jennifer@example.com",
    role: "Marketing",
    department: "Marketing",
    status: "pending",
    salary: 59000,
    joinDate: "2023-04-18",
  },
  {
    id: 19,
    name: "Ryan Miller",
    email: "ryan@example.com",
    role: "Designer",
    department: "Design",
    status: "active",
    salary: 72000,
    joinDate: "2023-01-22",
  },
  {
    id: 20,
    name: "Nicole Brown",
    email: "nicole@example.com",
    role: "Developer",
    department: "Engineering",
    status: "active",
    salary: 77000,
    joinDate: "2023-03-08",
  },
]

export default function About() {
    return (
        <div class="w-full">
test

      <DataTable
        data={sampleData}
        pageSize={5}
        columns={[
          {
            key: "name",
            label: "Name",
            filterable: true,
            sortable: true,
          },
          {
            key: "email",
            label: "Email",
            sortable: true,
          },
          {
            key: "role",
            label: "Role",
            filterable: true,
            sortable: true,
          },
          {
            key: "department",
            label: "Department",
            filterable: true,
            sortable: true,
          },
          {
            key: "status",
            label: "Status",
            filterable: true,
            sortable: true,
            render: (value) => {
              const colors = {
                active: "bg-green-100 text-green-800",
                inactive: "bg-gray-100 text-gray-800",
                pending: "bg-yellow-100 text-yellow-800",
              }
              return (
                <span class={`rounded-full px-2 py-1 text-xs font-medium ${colors[value as keyof typeof colors]}`}>
                  {value as string}
                </span>
              )
            },
          },
          {
            key: "salary",
            label: "Salary",
            sortable: true,
            render: (value) => `$${(value as number).toLocaleString()}`,
          },
          {
            key: "joinDate",
            label: "Join Date",
            sortable: true,
            render: (value) => new Date(value as string).toLocaleDateString(),
          },
        ]}
        searchableColumns={["name", "email", "role"]}
        title="Employee Directory"
        description="Manage your team members and their information"
      />
    </div>
    )
}