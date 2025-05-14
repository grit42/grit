import GritApplication from "@grit42/app";
import CoreModule from "@grit42/core";
import CompoundsModule from "@grit42/compounds";

GritApplication.registerModule(CoreModule)
GritApplication.registerModule(CompoundsModule)
GritApplication.setTitle("grit compounds")
GritApplication.setDefaultRoute("compounds")
GritApplication.mount()
