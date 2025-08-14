import { Title } from "@solidjs/meta";
import { createEffect, Show } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
import { TextField, TextFieldLabel, TextFieldInput } from "$components/ui/text-field";
import { Button } from "~/components/ui/button";
import { loginAction } from "$lib/auth-actions";
import { useSubmission } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";

export default function Login() {
  let navigate = useNavigate();
  let loginSubmission = useSubmission(loginAction)

  createEffect(() => {
    if (loginSubmission.error) {
      alert("Login failed:" + loginSubmission.error);
      // Handle error display logic here, e.g., show a toast or alert
    }
    else if (loginSubmission.result) {
    
    }
  });

  return (
    <main class="flex items-center justify-center h-screen">
      <Title>Login</Title>
      <Card class="w-[380px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div>
            <form action={loginAction} method="post" class="flex gap-3 flex-col">
              <TextField class="grid w-full max-w-sm items-center gap-1.5">
                <TextFieldLabel for="username">Username</TextFieldLabel>
                <TextFieldInput name="username" placeholder="Username" required />
              </TextField>
              <TextField class="grid w-full max-w-sm items-center gap-1.5">
                <TextFieldLabel for="password">Password</TextFieldLabel>
                <TextFieldInput type="password" name="password" placeholder="XXXXXXX" required />
              </TextField>
              <Button type="submit">
                Login
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
