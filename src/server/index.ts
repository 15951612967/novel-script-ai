import { createApp } from "./app";

const port = Number(process.env.PORT ?? 8787);
const app = createApp();

app.listen(port, () => {
  console.log(`AI novel script server listening on http://127.0.0.1:${port}`);
});
