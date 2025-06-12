import { ProjectGraphProjectNode, Tree } from "@nx/devkit";
import { join } from "node:path";
import { AfterAllProjectsVersioned, VersionActions } from "nx/release";
import { ReleaseGroupWithName } from "nx/src/command-line/release/config/filter-release-groups";
import { FinalConfigForProject } from "nx/src/command-line/release/version/release-group-processor";
import { readdirSync, statSync } from "node:fs";

export const afterAllProjectsVersioned: AfterAllProjectsVersioned = async (
  _cwd,
  _opts,
) => {
  return {
    changedFiles: [],
    deletedFiles: [],
  };
};

export default class RubyVersionActions extends VersionActions {
  validManifestFilenames = [];

  constructor(
    releaseGroup: ReleaseGroupWithName,
    projectGraphNode: ProjectGraphProjectNode,
    finalConfigForProject: FinalConfigForProject,
  ) {
    super(releaseGroup, projectGraphNode, finalConfigForProject);
    const files = [];
    function through_directory(path: string) {
      readdirSync(path).forEach((file) => {
        const absolute = join(path, file);
        if (statSync(absolute).isDirectory())
          return through_directory(absolute);
        else if (file === "version.rb") return files.push(absolute);
      });
    }
    through_directory(this.projectGraphNode.data.root);

    if (files.length !== 1) {
      throw new Error(
        `Unable to determine the current version for project "${this.projectGraphNode.name}" from 'version.rb', please ensure that the version file exists.`,
      );
    }

    this.validManifestFilenames = [
      files[0].toString().replace(`${this.projectGraphNode.data.root}/`, ""),
    ];
  }

  async readCurrentVersionFromSourceManifest(tree: Tree): Promise<{
    currentVersion: string;
    manifestPath: string;
  }> {
    try {
      const currentVersion = tree
        .read(
          join(this.projectGraphNode.data.root, this.validManifestFilenames[0]),
        )
        .toString()
        .match(/(\d+\.\d+\.\d+(?:-(?:alpha|beta|rc\d+))?)/)[0];

      return {
        manifestPath: this.validManifestFilenames[0],
        currentVersion,
      };
    } catch {
      throw new Error(
        `Unable to determine the current version for project "${this.projectGraphNode.name}" from 'version.rb', please ensure that the "version" field is set within the package.json file`,
      );
    }
  }

  async readCurrentVersionFromRegistry(): Promise<{
    currentVersion: string;
    logText: string;
  }> {
    return null;
  }

  async readCurrentVersionOfDependency(): Promise<{
    currentVersion: string | null;
    dependencyCollection: string | null;
  }> {
    return {
      currentVersion: "workspace:",
      dependencyCollection: "dependencies",
    };
  }

  async updateProjectVersion(
    tree: Tree,
    newVersion: string,
  ): Promise<string[]> {
    const logMessages: string[] = [];
    for (const manifestToUpdate of this.manifestsToUpdate) {
      const content = tree
        .read(manifestToUpdate.manifestPath)
        .toString()
        .replace(/(\d+\.\d+\.\d+(?:-(?:alpha|beta|rc\d+))?)/, newVersion);
      tree.write(manifestToUpdate.manifestPath, content);
      logMessages.push(
        `✍️  New version ${newVersion} written to manifest: ${manifestToUpdate.manifestPath}`,
      );
    }
    return logMessages;
  }

  async updateProjectDependencies(): Promise<string[]> {
    return [];
  }
}
