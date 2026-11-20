import { writeStaticApi } from "./api-surface.ts";

const manifest = await writeStaticApi("out");
console.log(`exported ${manifest.files.length} public api files to out/`);
