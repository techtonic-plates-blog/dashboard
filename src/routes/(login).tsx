import { JSX } from "solid-js";

export default function LoginLayout(props: { children: JSX.Element }) {
  return (
    <>
      {props.children}
    </>
  );
}
