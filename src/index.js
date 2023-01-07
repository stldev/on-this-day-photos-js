import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path, { normalize } from "node:path";
import * as url from "url";
import fg from "fast-glob";
import { persons, exts, fileShare, appScope, emailCfg } from "./config.js";

const today = new Date().toISOString().split("T")[0];
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const scriptPath = path.join(__dirname, "./send-email.ps1");

function sendEmail(link, email, count) {
  const body = `You have ${count} media items, please view here: ${link}`;
  const creds = `-emailuser "${emailCfg.from}" -emailpass "${emailCfg.pass}"`;
  const scriptArgs2 = `-emailto "${email}" -emailsubject "${emailCfg.subject}" -emailbody "${body}" ${creds}`;

  execSync(`${scriptPath} ${scriptArgs2}`, {
    stdio: "inherit",
    encoding: "utf-8",
    shell: "powershell",
  });
}

async function start() {
  for await (const person of persons) {
    const destDir = `${fileShare}\\${appScope}\\${person.name}\\${today}`;

    if (!existsSync(destDir)) mkdirSync(destDir);

    const files = await fg(`${person.srcPath}/**/*.+(${exts.join("|")})`);

    // console.log("files-found", files);

    files.forEach((filePath) => {
      const nameChunks = filePath.split("/");
      const fileName = nameChunks[nameChunks.length - 1];
      copyFileSync(normalize(filePath), `${destDir}\\${fileName}`);
    });

    sendEmail(person.link, person.email, files.length);
  }

  return "DONE!";
}

start()
  .then((result) => console.log("THEN: ", result))
  .catch((err) => console.log("ERR: ", err));
