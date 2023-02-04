import {
  copyFileSync,
  existsSync,
  mkdirSync,
  statSync,
  futimesSync,
  openSync,
  closeSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { execSync } from "node:child_process";
import path, { normalize } from "node:path";
import * as url from "url";
import Jimp from "jimp";
import {
  persons,
  exts,
  fileShare,
  filesSrc,
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

// const today = "2023-02-04";
const today = new Date().toISOString().split("T")[0];
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const scriptEmail = path.join(__dirname, "./send-email.ps1");
const scriptGetFiles = path.join(__dirname, "./get-file-list.ps1");

function sendEmail(link, email, count) {
  const body = `You have ${count} media items, please view here: <a href='${link}'>Photos of the day</a>`;
  const creds = `-emailuser "${emailCfg.from}" -emailpass "${emailCfg.pass}"`;
  const scriptArgs2 = `-emailto "${email}" -emailsubject "${emailCfg.subject}" -emailbody "${body}" ${creds}`;

  execSync(`${scriptEmail} ${scriptArgs2}`, execOpts);
}

async function fixOrientation(allTempFiles, destDir) {
  for await (const filePath of allTempFiles) {
    if (
      filePath?.toLowerCase().endsWith(".jpg") ||
      filePath?.toLowerCase().endsWith(".jpeg")
    ) {
      const fileStat = statSync(`${destDir}/temp/${filePath}`);
      const mTime = fileStat.mtime;
      const aaa = `${destDir}/temp/${filePath}`;
      execSync(`npx jpeg-autorotate "${aaa}"`);
      await new Promise((resolve) => setTimeout(() => resolve(""), 20));
      const fd = openSync(`${destDir}/temp/${filePath}`, "r+");
      futimesSync(fd, fileStat.atime, mTime);
      closeSync(fd);
    }
  }
}
async function addYearText(allTempFiles, destDir) {
  const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);

  for await (const tempFile of allTempFiles) {
    if (
      tempFile?.toLowerCase().endsWith(".jpg") ||
      tempFile?.toLowerCase().endsWith(".jpeg")
    ) {
      const fileStat = statSync(`${destDir}/temp/${tempFile}`);
      const mTime = fileStat.mtime;
      const printDate = new Date(mTime).getFullYear().toString();

      const image = await Jimp.read(`${destDir}/temp/${tempFile}`);

      for (let i = -50; i < 20; i++) {
        image.print(fontWhite, i, i, "|||||||||||");
      }

      image.print(fontBlack, 7, 7, printDate);
      image.writeAsync(`${destDir}/${tempFile}`);

      await new Promise((resolve) => setTimeout(() => resolve(""), 99));

      const fd = openSync(`${destDir}/${tempFile}`, "r+");
      futimesSync(fd, fileStat.atime, mTime);
      closeSync(fd);
    } else {
      copyFileSync(`${destDir}/temp/${tempFile}`, `${destDir}/${tempFile}`);
    }
  }
}

async function start() {
  for await (const person of persons) {
    const destDir = `${fileShare}\\${appScope}\\${person.name}\\${today}`;

    if (!existsSync(destDir)) mkdirSync(destDir);
    if (!existsSync(`${destDir}/temp`)) mkdirSync(`${destDir}/temp`);

    const srcDir = `${filesSrc}\\person_${person.name}${person.extraPath}`;
    const dotExts = exts.map((m) => `.${m}`);
    const extsJson = JSON.stringify(dotExts);
    const month = Number(today.split("-")[1]);
    const day = Number(today.split("-")[2]);

    const scriptArgs = `-personsrcpath "${srcDir}" -exts '${extsJson}' -dtmonth ${month} -dtday ${day}`;
    const filesJson = execSync(`${scriptGetFiles} ${scriptArgs}`, execOpts);
    const files = JSON.parse(filesJson) || [];

    files.forEach((filePath) => {
      const nameChunks = filePath.split("\\");
      const fileName = nameChunks[nameChunks.length - 1];
      copyFileSync(normalize(filePath), `${destDir}\\temp\\${fileName}`);
    });

    const allTempFiles = readdirSync(`${destDir}/temp`);

    await fixOrientation(allTempFiles, destDir);

    await addYearText(allTempFiles, destDir);

    rmSync(`${destDir}\\temp`, { recursive: true, forc: true });

    // sendEmail(person.link, emailCfg.admin, files.length); // FOR_TESTING
    sendEmail(person.link, person.email, files.length);
  }

  return "DONE!";
}

start()
  .then((result) => console.log("THEN: ", result))
  .catch((err) => console.log("ERR: ", err));
