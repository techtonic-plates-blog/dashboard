import { Title } from "@solidjs/meta";
import { action, createAsync, query } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
import { TextField, TextFieldLabel, TextFieldInput } from "$components/ui/text-field";
import { Button } from "$components/ui/button";
import { Separator } from "$components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectHiddenSelect } from "$components/ui/select";
import { useAuth } from "$lib/providers/auth-provider";
import { authClient } from "$lib/client";
import { components } from "$api/auth-client";

type UpdateUsernameRequest = components["schemas"]["UpdateUsernameRequest"];
type UpdateMyPasswordRequest = components["schemas"]["UpdateMyPasswordRequest"];
type UpdateStatusRequest = components["schemas"]["UpdateStatusRequest"];
type AllowedUserStatus = components["schemas"]["AllowedUserStatus"];

// Server actions for updating user settings
const updateUsernameAction = action(async (formData: FormData) => {
  "use server";
  const newUsername = formData.get("new_username") as string;

  if (!newUsername?.trim()) {
    return { success: false, error: "Username is required" };
  }

  try {
    const { data, error } = await authClient.PATCH("/me/username", {
      body: { new_username: newUsername.trim() } satisfies UpdateUsernameRequest,
    });

    if (error) {
      return { success: false, error: "Failed to update username" };
    }

    return { success: true, message: "Username updated successfully" };
  } catch (error) {
    console.error("Error updating username:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}, "update-username");

const updatePasswordAction = action(async (formData: FormData) => {
  "use server";
  const oldPassword = formData.get("old_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All password fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long" };
  }

  try {
    const { data, error } = await authClient.PATCH("/me/password", {
      body: { 
        old_password: oldPassword, 
        new_password: newPassword 
      } satisfies UpdateMyPasswordRequest,
    });

    if (error) {
      return { success: false, error: "Failed to update password. Please check your current password." };
    }

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}, "update-password");

const updateStatusAction = action(async (formData: FormData) => {
  "use server";
  const status = formData.get("status") as AllowedUserStatus;

  if (!status) {
    return { success: false, error: "Status is required" };
  }

  try {
    const { data, error } = await authClient.PATCH("/me/status", {
      body: { status } satisfies UpdateStatusRequest,
    });

    if (error) {
      return { success: false, error: "Failed to update account status" };
    }

    return { success: true, message: "Account status updated successfully" };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}, "update-status");

// Query to get current user info
const userQuery = query(async () => {
  "use server";
  const { data } = await authClient.GET("/me");
  return data;
}, "current-user");

export default function UserSettings() {
  const auth = useAuth();
  const currentUser = createAsync(() => userQuery());
  
  // Username form state
  const [usernameStatus, setUsernameStatus] = createSignal<"idle" | "submitting" | "success" | "error">("idle");
  const [usernameMessage, setUsernameMessage] = createSignal<string>("");
  let usernameFormRef: HTMLFormElement | undefined;

  // Password form state
  const [passwordStatus, setPasswordStatus] = createSignal<"idle" | "submitting" | "success" | "error">("idle");
  const [passwordMessage, setPasswordMessage] = createSignal<string>("");
  let passwordFormRef: HTMLFormElement | undefined;

  // Status form state
  const [statusFormStatus, setStatusFormStatus] = createSignal<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = createSignal<string>("");
  const [selectedStatus, setSelectedStatus] = createSignal<AllowedUserStatus | null>(null);
  let statusFormRef: HTMLFormElement | undefined;

  const handleUsernameSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!usernameFormRef) return;
    
    setUsernameStatus("submitting");
    setUsernameMessage("");

    try {
      const formData = new FormData(usernameFormRef);
      const result = await updateUsernameAction(formData);
      
      if (result.success) {
        setUsernameStatus("success");
        setUsernameMessage(result.message || "Username updated successfully");
        usernameFormRef.reset();
        // Reload user data to reflect changes
        window.location.reload();
      } else {
        setUsernameStatus("error");
        setUsernameMessage(result.error || "Failed to update username");
      }
    } catch (error) {
      console.error("Username update error:", error);
      setUsernameStatus("error");
      setUsernameMessage("An error occurred while updating username");
    }
  };

  const handlePasswordSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!passwordFormRef) return;
    
    setPasswordStatus("submitting");
    setPasswordMessage("");

    try {
      const formData = new FormData(passwordFormRef);
      const result = await updatePasswordAction(formData);
      
      if (result.success) {
        setPasswordStatus("success");
        setPasswordMessage(result.message || "Password updated successfully");
        passwordFormRef.reset();
      } else {
        setPasswordStatus("error");
        setPasswordMessage(result.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      setPasswordStatus("error");
      setPasswordMessage("An error occurred while updating password");
    }
  };

  const handleStatusSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!statusFormRef) return;
    
    setStatusFormStatus("submitting");
    setStatusMessage("");

    try {
      const formData = new FormData(statusFormRef);
      const result = await updateStatusAction(formData);
      
      if (result.success) {
        setStatusFormStatus("success");
        setStatusMessage(result.message || "Account status updated successfully");
      } else {
        setStatusFormStatus("error");
        setStatusMessage(result.error || "Failed to update account status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      setStatusFormStatus("error");
      setStatusMessage("An error occurred while updating account status");
    }
  };

  return (
    <>
      <Title>Account Settings</Title>
      
      <div class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p class="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Separator />

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Account Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <span class="text-sm font-medium text-muted-foreground">Username:</span>
              <p class="text-lg font-semibold">{currentUser()?.username || auth.user()?.username || "Loading..."}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-muted-foreground">User ID:</span>
              <p class="text-sm text-muted-foreground font-mono">{currentUser()?.id || auth.user()?.id || "Loading..."}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-muted-foreground">Permissions:</span>
              <p class="text-sm">{currentUser()?.permissions?.join(", ") || auth.user()?.permissions?.join(", ") || "Loading..."}</p>
            </div>
          </CardContent>
        </Card>

        {/* Update Username */}
        <Card>
          <CardHeader>
            <CardTitle>Update Username</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={usernameFormRef} onSubmit={handleUsernameSubmit} class="space-y-4">
              <TextField>
                <TextFieldLabel for="new_username">New Username</TextFieldLabel>
                <TextFieldInput
                  id="new_username"
                  name="new_username"
                  type="text"
                  placeholder="Enter new username"
                  required
                  disabled={usernameStatus() === "submitting"}
                />
              </TextField>

              <Show when={usernameMessage()}>
                <div class={`text-sm p-3 rounded-md ${
                  usernameStatus() === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {usernameMessage()}
                </div>
              </Show>

              <Button 
                type="submit" 
                disabled={usernameStatus() === "submitting"}
                class="w-full sm:w-auto"
              >
                {usernameStatus() === "submitting" ? "Updating..." : "Update Username"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update Password */}
        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={passwordFormRef} onSubmit={handlePasswordSubmit} class="space-y-4">
              <TextField>
                <TextFieldLabel for="old_password">Current Password</TextFieldLabel>
                <TextFieldInput
                  id="old_password"
                  name="old_password"
                  type="password"
                  placeholder="Enter current password"
                  required
                  disabled={passwordStatus() === "submitting"}
                />
              </TextField>

              <TextField>
                <TextFieldLabel for="new_password">New Password</TextFieldLabel>
                <TextFieldInput
                  id="new_password"
                  name="new_password"
                  type="password"
                  placeholder="Enter new password (min. 8 characters)"
                  required
                  minLength={8}
                  disabled={passwordStatus() === "submitting"}
                />
              </TextField>

              <TextField>
                <TextFieldLabel for="confirm_password">Confirm New Password</TextFieldLabel>
                <TextFieldInput
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  disabled={passwordStatus() === "submitting"}
                />
              </TextField>

              <Show when={passwordMessage()}>
                <div class={`text-sm p-3 rounded-md ${
                  passwordStatus() === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {passwordMessage()}
                </div>
              </Show>

              <Button 
                type="submit" 
                disabled={passwordStatus() === "submitting"}
                class="w-full sm:w-auto"
              >
                {passwordStatus() === "submitting" ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Update Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={statusFormRef} onSubmit={handleStatusSubmit} class="space-y-4">
              <div>
                <label for="status" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Account Status
                </label>
                <Select
                  value={selectedStatus()}
                  onChange={(value: AllowedUserStatus | null) => {
                    setSelectedStatus(value);
                  }}
                  options={["active", "inactive"]}
                  placeholder="Select account status"
                  disabled={statusFormStatus() === "submitting"}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      <div class="capitalize">{props.item.rawValue}</div>
                    </SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(state) => (
                        <div class="capitalize">{String(state.selectedOption())}</div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                  <SelectHiddenSelect name="status" />
                </Select>
                <p class="text-sm text-muted-foreground mt-1">
                  Set your account status. Inactive accounts may have limited functionality.
                </p>
              </div>

              <Show when={statusMessage()}>
                <div class={`text-sm p-3 rounded-md ${
                  statusFormStatus() === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {statusMessage()}
                </div>
              </Show>

              <Button 
                type="submit" 
                disabled={statusFormStatus() === "submitting"}
                class="w-full sm:w-auto"
              >
                {statusFormStatus() === "submitting" ? "Updating..." : "Update Status"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
