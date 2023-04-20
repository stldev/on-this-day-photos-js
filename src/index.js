import { copyFileSync, existsSync, mkdirSync, rmdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path, { normalize } from "node:path";
import * as url from "url";
import {
  persons,
  exts,
  fileShare,
  filesSrc,
  appScope,
  pwshLocation,
} from "./config.js";

const execOpts = {
  // stdio: "inherit", // If uncommented then execSync does NOT return data
  encoding: "utf-8",
  shell: pwshLocation || "powershell",
  windowsHide: true,
};

// const today = "2023-02-05"; // FOR_TESTING
const today = new Date().toISOString().split("T")[0];
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
// const scriptEmail = path.join(__dirname, "./send-email.ps1");
const scriptGetFiles = path.join(__dirname, "./get-file-list.ps1");
// const scriptSetCreatedDate = path.join(__dirname, "./set-created-date.ps1");

// function sendEmail(link, email, count) {
//   const body = `You have ${count} media items, please view here: <a href='${link}'>Photos of the day</a>`;
//   const creds = `-emailuser "${emailCfg.from}" -emailpass "${emailCfg.pass}"`;
//   const scriptArgs2 = `-emailto "${email}" -emailsubject "${emailCfg.subject}" -emailbody "${body}" ${creds}`;

//   execSync(`${scriptEmail} ${scriptArgs2}`, execOpts);
// }

async function start() {
  console.time("DO_IT");

  for await (const person of persons) {
    // const destDir = `${fileShare}\\${appScope}\\${person.name}\\${today}`;
    const destDir = `${fileShare}\\${appScope}\\${person.name}SrcMedia`;

    if (existsSync(destDir)) rmdirSync(destDir, { recursive: true });
    mkdirSync(destDir);

    const srcDir = `${filesSrc}\\person_${person.name}${person.extraPath}`;
    const dotExts = exts.map((m) => `.${m}`);
    const extsJson = JSON.stringify(dotExts);
    const month = Number(today.split("-")[1]);
    const day = Number(today.split("-")[2]);

    const scriptArgs = `-personsrcpath "${srcDir}" -exts '${extsJson}' -dtmonth ${month} -dtday ${day}`;
    const filesJson = execSync(`${scriptGetFiles} ${scriptArgs}`, execOpts);
    const files = filesJson.length < 9 ? [] : JSON.parse(filesJson || []);

    files.forEach((filePath) => {
      const nameChunks = filePath.split("\\");
      const fileName = nameChunks[nameChunks.length - 1];
      copyFileSync(normalize(filePath), `${destDir}\\${fileName}`);

      // const scriptArgs2 = `-filedir "${destDir}" -filename "${fileName}"`;
      // execSync(`${scriptSetCreatedDate} ${scriptArgs2}`, execOpts);
    });

    // sendEmail(person.link, emailCfg.admin, files.length); // FOR_TESTING
    // sendEmail(person.link, person.email, files.length);
  }

  console.timeEnd("DO_IT");

  return "DONE!";
}

start()
  .then((result) => console.log("THEN: ", result))
  .catch((err) => console.log("ERR: ", err));
