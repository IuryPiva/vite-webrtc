export const sendSignal = (body: any) =>
  fetch("http://localhost:8000", {
    method: "POST",
    body: JSON.stringify(body),
  });
