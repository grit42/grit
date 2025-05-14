import GritApplication from "@grit42/app";
import CoreModule from "@grit42/core";
import AssaysModule from "@grit42/assays";

GritApplication.registerModule(CoreModule)
GritApplication.registerModule(AssaysModule)
GritApplication.setTitle("grit assays")
GritApplication.mount()
