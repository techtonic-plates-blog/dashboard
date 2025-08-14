import { JSX, Show } from "solid-js";
import { User } from "../lib/providers/auth-provider";
import { hasPermission } from "../lib/session";

export interface SimplePermissionGuardProps {
  user: User | null;
  action: string;
  resource: string;
  fallback?: JSX.Element;
  children: JSX.Element;
}

export default function SimplePermissionGuard(props: SimplePermissionGuardProps) {
  const allowed = () => props.user ? hasPermission(props.user, props.action, props.resource) : false;
  
  return (
    <Show when={allowed()} fallback={props.fallback}>
      {props.children}
    </Show>
  );
}
