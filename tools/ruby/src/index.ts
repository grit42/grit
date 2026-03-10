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
export interface RubyPluginOptions {
  /** Name for the test target (default: "test") */
  testTargetName?: string;
  /** Name for the lint target (default: "lint") */
  lintTargetName?: string;
  /** Name for the dev target (default: "dev") */
  devTargetName?: string;
  /** Name for the rails passthrough target (default: "rails") */
  railsTargetName?: string;
  /** Whether to create database targets (default: true) */
  createDbTargets?: boolean;
}

const defaultOptions: Required<RubyPluginOptions> = {
  testTargetName: "test",
  lintTargetName: "lint",
  devTargetName: "dev",
  railsTargetName: "rails",
  createDbTargets: true,
};

// File glob to find all the configuration files for this plugin
const gemfileGlob = "**/{Gemfile,*.gemspec}";

// Entry function that Nx calls to modify the graph
export const createNodesV2: CreateNodesV2<RubyPluginOptions> = [
  gemfileGlob,
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options ?? {}, context),
      configFiles,
      options,
      context,
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: RubyPluginOptions,
  context: CreateNodesContextV2,
): Promise<CreateNodesResult> {
  const opts = { ...defaultOptions, ...options };
  const projectRoot = dirname(configFilePath);

  // Do not create a project if project.json isn't there.
  const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
  if (!siblingFiles.includes("project.json")) {
    return {};
  }

  // Bail if the config file is Gemfile and we're in an engine
  const gemspecFile = siblingFiles.find((siblingFile) =>
    siblingFile.endsWith(".gemspec"),
  );

  if (configFilePath.includes("Gemfile") && gemspecFile) {
    return {};
  }

  const isLibrary = !!gemspecFile;
  const hasRubocop = siblingFiles.includes(".rubocop.yml");
  const hasRailsBinstub = existsSync(
    join(context.workspaceRoot, projectRoot, "bin", "rails"),
  );

  // Build targets object
  const targets: Record<string, TargetConfiguration> = {};

  // ===================
  // Dev / Serve targets
  // ===================
  if (hasRailsBinstub) {
    const devTarget: TargetConfiguration = {
      command: `bin/rails server`,
      continuous: true,
      options: { cwd: projectRoot },
    };

    targets[opts.devTargetName] = devTarget;
    targets["serve"] = devTarget;

    // Dev/Serve with test environment
    const devTestTarget: TargetConfiguration = {
      command: `RAILS_ENV=test bin/rails server`,
      continuous: true,
      options: { cwd: projectRoot },
      dependsOn: [{ target: "db:reset:test" }],
    };

    targets[`${opts.devTargetName}:test`] = devTestTarget;
    targets["serve:test"] = devTestTarget;
  }

  // ===================
  // Test target
  // ===================
  if (hasRailsBinstub) {
    const testInputs: string[] = [
      "{projectRoot}/Gemfile",
      "{projectRoot}/Gemfile.lock",
      joinPathFragments("{projectRoot}", "app", "**", "*"),
      joinPathFragments("{projectRoot}", "lib", "**", "*"),
      joinPathFragments("{projectRoot}", "config", "**", "*"),
      joinPathFragments("{projectRoot}", "test", "**", "*"),
    ];

    // Only include gemspec if it exists
    if (gemspecFile) {
      testInputs.unshift(joinPathFragments("{projectRoot}", gemspecFile));
    }

    const testTarget: TargetConfiguration = {
      command: `bin/rails test`,
      options: { cwd: projectRoot },
      cache: true,
      inputs: testInputs,
      dependsOn: ["^build"],
    };

    targets[opts.testTargetName] = testTarget;
  }

  // ===================
  // Lint targets (auto-detect Rubocop)
  // ===================
  if (hasRubocop) {
    const lintTarget: TargetConfiguration = {
      command: `bundle exec rubocop -A`,
      options: { cwd: projectRoot },
      cache: false,
    };

    const lintCheckTarget: TargetConfiguration = {
      command: `bundle exec rubocop`,
      options: { cwd: projectRoot },
      cache: true,
      inputs: [
        joinPathFragments("{projectRoot}", "**", "*.rb"),
        "{projectRoot}/.rubocop.yml",
        "{projectRoot}/Gemfile.lock",
      ],
    };

    targets[opts.lintTargetName] = lintTarget;
    targets[`${opts.lintTargetName}:check`] = lintCheckTarget;
  }

  // ===================
  // Database targets
  // ===================
  if (opts.createDbTargets && hasRailsBinstub) {
    // Development environment
    targets["db:migrate"] = {
      command: `bin/rails db:migrate`,
      options: { cwd: projectRoot },
    };

    targets["db:reset"] = {
      command: `bin/rails db:reset`,
      options: { cwd: projectRoot },
    };

    targets["db:seed"] = {
      command: `bin/rails db:seed`,
      options: { cwd: projectRoot },
    };

    targets["db:setup"] = {
      command: `bin/rails db:setup`,
      options: { cwd: projectRoot },
    };

    // Test environment
    targets["db:migrate:test"] = {
      command: `RAILS_ENV=test bin/rails db:migrate`,
      options: { cwd: projectRoot },
    };

    targets["db:reset:test"] = {
      command: `RAILS_ENV=test bin/rails db:reset`,
      options: { cwd: projectRoot },
    };
  }

  // ===================
  // Rails passthrough target
  // ===================
  if (hasRailsBinstub) {
    targets[opts.railsTargetName] = {
      command: "bin/rails {args}",
      options: { cwd: projectRoot },
    };
  }

  // ===================
  // Bundle target
  // ===================
  targets["bundle"] = {
    command: `bundle install`,
    options: { cwd: projectRoot },
    cache: true,
    inputs: ["{projectRoot}/Gemfile", "{projectRoot}/*.gemspec"],
    outputs: ["{projectRoot}/Gemfile.lock"],
  };

  // ===================
  // Gem package target (gems only)
  // Named "gem:build" to avoid conflicting with JS "build" targets in the dependency chain
  // ===================
  if (isLibrary && gemspecFile) {
    targets["gem:build"] = {
      command: "gem build " + gemspecFile,
      options: { cwd: projectRoot },
      cache: true,
      inputs: [
        joinPathFragments("{projectRoot}", gemspecFile),
        joinPathFragments("{projectRoot}", "lib", "**", "*"),
        joinPathFragments("{projectRoot}", "app", "**", "*"),
        joinPathFragments("{projectRoot}", "config", "**", "*"),
        joinPathFragments("{projectRoot}", "db", "**", "*"),
      ],
      outputs: [joinPathFragments("{projectRoot}", "*.gem")],
    };
  }

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
        targets,
      },
    },
  };
}

export const createDependencies: CreateDependencies = (_opts, ctx) => {
  const gemspecProjectMap = new Map<string, string>();
  const nxProjects = Object.values(ctx.projects);
  const results: RawProjectGraphDependency[] = [];
  for (const project of nxProjects) {
    const maybeGemspecPath = join(project.root, `${project.name}.gemspec`);
    if (existsSync(maybeGemspecPath)) {
      const gem_name = execSync(
        `ruby ${ctx.workspaceRoot}/tools/ruby/scripts/gem_name.rb ${ctx.workspaceRoot}/${maybeGemspecPath}`,
      )
        .toString()
        .trim();
      gemspecProjectMap.set(gem_name, project.name!);
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
            source: project.name!,
            target: gemspecProjectMap.get(dep)!,
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
            source: project.name!,
            target: gemspecProjectMap.get(dep)!,
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
