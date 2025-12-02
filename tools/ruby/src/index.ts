import {
  CreateDependencies,
  DependencyType,
  RawProjectGraphDependency,
  validateDependency,
  CreateNodesContextV2,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
  joinPathFragments,
  CreateNodesResult,
} from "@nx/devkit";
import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { dirname, join } from "path";

// Expected format of the plugin options defined in nx.json
export interface RubyPluginOptions {}

// File glob to find all the configuration files for this plugin
const gemfileGlob = "**/{Gemfile,*.gemspec}";

// Entry function that Nx calls to modify the graph
export const createNodesV2: CreateNodesV2<RubyPluginOptions> = [
  gemfileGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context,
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  _options: RubyPluginOptions,
  context: CreateNodesContextV2,
): Promise<CreateNodesResult> {
  const projectRoot = dirname(configFilePath);

  // Do not create a project if package.json or project.json isn't there.
  const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
  if (!siblingFiles.includes("project.json")) {
    return {};
  }

  // Bail if the config file is Gemfile and we're in an engine
  const gemspecFile = siblingFiles.find((siblingFile) =>
    siblingFile.includes(".gemspec"),
  );

  if (configFilePath.includes("Gemfile") && gemspecFile) {
    return {};
  }

  const isLibrary = !!gemspecFile;

  // Inferred tasks

  const devTarget: TargetConfiguration = {
    command: `bundle exec server`,
    continuous: true,
    options: { cwd: projectRoot },
  };

  const releasePublishTarget: TargetConfiguration = isLibrary
    ? {
        executor: "ruby:release-publish",
        options: {
          cwd: projectRoot,
        },
        cache: false,
        inputs: [
          `{projectRoot}/${gemspecFile}`,
          `{projectRoot}/Gemfile`,
          `{projectRoot}/Gemfile.lock`,
          joinPathFragments("{projectRoot}", "app", "**", "*"),
          joinPathFragments("{projectRoot}", "lib", "**", "*"),
        ],
      }
    : undefined;

  const testTarget: TargetConfiguration = {
    command: `bin/rails test`,
    options: { cwd: projectRoot },
    cache: true,
    inputs: [
      `{projectRoot}/${gemspecFile}`,
      `{projectRoot}/Gemfile`,
      `{projectRoot}/Gemfile.lock`,
      joinPathFragments("{projectRoot}", "app", "**", "*"),
      joinPathFragments("{projectRoot}", "lib", "**", "*"),
    ],
  };

  // Project configuration to be merged into the rest of the Nx configuration

  return {
    projects: {
      [projectRoot]: {
        release: {
          version: {
            versionActions: `${context.workspaceRoot}/tools/ruby/src/release/version-actions.ts`,
          },
        },
        projectType: isLibrary ? "library" : "application",
        targets: {
          dev: devTarget,
          serve: devTarget,
          test: testTarget,
          "nx-release-publish": releasePublishTarget,
        },
      },
    },
  };
}

export const createDependencies: CreateDependencies = (opts, ctx) => {
  const gemspecProjectMap = new Map();
  const nxProjects = Object.values(ctx.projects);
  const results = [];
  for (const project of nxProjects) {
    const maybeGemspecPath = join(project.root, `${project.name}.gemspec`);
    if (existsSync(maybeGemspecPath)) {
      const gem_name = execSync(
        `ruby ${ctx.workspaceRoot}/tools/ruby/scripts/gem_name.rb ${ctx.workspaceRoot}/${maybeGemspecPath}`,
      )
        .toString()
        .trim();
      gemspecProjectMap.set(gem_name, project.name);
    }
  }

  for (const project of nxProjects) {
    const maybeGemspecPath = join(project.root, `${project.name}.gemspec`);
    const maybeGemfilePath = join(project.root, "Gemfile");

    if (existsSync(maybeGemspecPath)) {
      const gem_deps = execSync(
        `ruby ${ctx.workspaceRoot}/tools/ruby/scripts/gemspec_deps.rb ${ctx.workspaceRoot}/${maybeGemspecPath}`,
      );
      const deps = gem_deps.toString().trim().split(",");
      for (const dep of deps) {
        if (gemspecProjectMap.has(dep)) {
          const newDependency: RawProjectGraphDependency = {
            type: DependencyType.static,
            source: project.name,
            target: gemspecProjectMap.get(dep),
            sourceFile: maybeGemspecPath,
          };

          validateDependency(newDependency, ctx);
          results.push(newDependency);
        }
      }
    } else if (existsSync(maybeGemfilePath)) {
      const gem_deps = execSync(
        `ruby ${ctx.workspaceRoot}/tools/ruby/scripts/gemfile_deps.rb ${ctx.workspaceRoot}/${maybeGemfilePath}`,
      );
      const deps = gem_deps.toString().trim().split(",");
      for (const dep of deps) {
        if (gemspecProjectMap.has(dep)) {
          const newDependency: RawProjectGraphDependency = {
            type: DependencyType.static,
            source: project.name,
            target: gemspecProjectMap.get(dep),
            sourceFile: maybeGemfilePath,
          };

          validateDependency(newDependency, ctx);
          results.push(newDependency);
        }
      }
    }
  }
  return results;
};
