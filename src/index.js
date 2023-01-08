import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path, { normalize } from "node:path";
import * as url from "url";
import {
  persons,
  exts,
  fileShare,
  appScope,
  emailCfg,
  pwshLocation,
} from "./config.js";

const execOpts = {
  // stdio: "inherit", // If uncommented then execSync does NOT return data
  encoding: "utf-8",
  shell: pwshLocation || "powershell",
  windowsHide: true,
};

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
    shell: pwshLocation || "powershell",
    windowsHide: true,
  });
}

async function start() {
  for await (const person of persons) {
    // const destDir = `${fileShare}\\${appScope}\\${person.name}\\${today}`;
    const destDir = `C:\\_CODE\\_STLDEV\\on-this-day-photos-js\\test-media\\rbb-imgs\\${today}`;

    if (!existsSync(destDir)) mkdirSync(destDir);

    // const destDir2 = `${fileShare}\\${appScope}\\${person.name}`;
    const destDir2 = `C:\\_CODE\\_STLDEV\\on-this-day-photos-js\\test-media\\${today}`;

    const dotExts = exts.map((m) => `.${m}`);
    const extsJson = JSON.stringify(dotExts);
    const month = Number(today.split("-")[1]) + 3;
    const day = Number(today.split("-")[2]) + 2;

    const scriptPath = path.join(__dirname, "./get-file-list.ps1");
    const scriptArgs = `-personsrcpath "${destDir2}" -exts '${extsJson}' -dtmonth ${month} -dtday ${day}`;

    const filesJson = execSync(`${scriptPath} ${scriptArgs}`, execOpts);

    const files = JSON.parse(filesJson || "[]");

    // console.log("files", files);

    files.forEach((filePath) => {
      const nameChunks = filePath.split("\\");
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
