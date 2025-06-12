import { joinPathFragments, PromiseExecutor } from "@nx/devkit";
import { ReleasePublishExecutorSchema } from "./schema";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
const LARGE_BUFFER = 1024 * 1000000;

const runExecutor: PromiseExecutor<ReleasePublishExecutorSchema> = async (
  options,
  context,
) => {
  const isDryRun = process.env.NX_DRY_RUN === "true" || options.dryRun || false;
  const projectConfig =
    context.projectsConfigurations.projects[context.projectName];
  const packageRoot = join(
    context.root,
    options.packageRoot ?? projectConfig.root,
  );

  const gemspecFile = readdirSync(packageRoot).find((f) =>
    f.endsWith(".gemspec"),
  );

  try {
    let command = `ruby ${join(
      context.root,
      "tools/ruby/scripts/build_and_push_gem.rb",
    )} -g ${gemspecFile} -k github -r https://rubygems.pkg.github.com/grit42`;
    if (isDryRun) {
      command += " --dry-run";
    }
    const output = execSync(command, {
      cwd: packageRoot,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false,
    }).toString();
  } catch (err) {
    console.error(`Unable to publish gem:`);
    console.error(err.stderr?.toString() || "");
    console.error(err.stdout?.toString() || "");
    return { success: false };
  }

  return {
    success: true,
  };
};

export default runExecutor;
