import { app } from "./app.js";
import { initDb } from "./db.js";

const port = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(port, () => {
    console.log(`[mit.mi] api dziala na porcie ${port}`);
  });
});
