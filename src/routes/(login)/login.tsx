import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, Match, Show, Switch } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
import { useAuth } from "$lib/providers/auth-provider";
import { TextField, TextFieldLabel, TextFieldInput } from "$components/ui/text-field";
import { Button } from "~/components/ui/button";


export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [status, setStatus] = createSignal<"idle" | "logging-in" | "error">("idle");
  const [errorMessage, setErrorMessage] = createSignal<string>("");
  let formRef: HTMLFormElement | undefined;

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    if (!formRef) return;
    
    const formData = new FormData(formRef);
    const username = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();

    if (!username || !password) {
      setErrorMessage("Please fill in all fields");
      setStatus("error");
      return;
    }

    setStatus("logging-in");
    setErrorMessage("");

    try {
      const success = await auth.login(username, password);
      
      if (success) {
        navigate("/");
      } else {
        setErrorMessage("Invalid username or password");
        setStatus("error");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An error occurred during login");
      setStatus("error");
    }
  };
  return (
    <main class="flex items-center justify-center h-screen">
      <Title>Login</Title>
      <Card class="w-[380px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div>
            <form ref={formRef} onsubmit={handleSubmit} class="flex gap-3 flex-col">
              <TextField class="grid w-full max-w-sm items-center gap-1.5">
                <TextFieldLabel for="username">Username</TextFieldLabel>
                <TextFieldInput name="username" placeholder="Username" required />
              </TextField>
              <TextField class="grid w-full max-w-sm items-center gap-1.5">
                <TextFieldLabel for="password">Password</TextFieldLabel>
                <TextFieldInput type="password" name="password" placeholder="XXXXXXX" required />
              </TextField>
              <Button type="submit" disabled={status() === "logging-in"}>
                {status() === "logging-in" ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <Show when={errorMessage()}>
              <div class="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {errorMessage()}
              </div>
            </Show>
            
            <Switch>
              <Match when={status() === "idle"}>
                <></>
              </Match>
              <Match when={status() === "logging-in"}>
                <div class="mt-4 text-center text-sm text-gray-600">
                  Authenticating...
                </div>
              </Match>
            </Switch>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
