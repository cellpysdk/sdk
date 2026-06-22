import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellpyBlockComponent } from './cellpy-block.component';

@NgModule({
  declarations: [CellpyBlockComponent],
  imports: [CommonModule],
  exports: [CellpyBlockComponent],
  // CUSTOM_ELEMENTS_SCHEMA here means consumers don't need to add it to their
  // own modules — <cellpy-block> inside our template is covered automatically.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CellpyBlockModule {}
