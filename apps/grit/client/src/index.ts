import GritApplication from "@grit42/app";
import CoreModule from "@grit42/core";
import CompoundsModule from "@grit42/compounds"
import AssaysModule from "@grit42/assays"

GritApplication.registerModule(CoreModule)
GritApplication.registerModule(CompoundsModule)
GritApplication.registerModule(AssaysModule)
GritApplication.setTitle("grit")
GritApplication.mount()
