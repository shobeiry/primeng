import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from 'src/app/showcase/layout/app.component';
import { config } from 'src/app/showcase/layout/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
