import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { StoryLayout } from '../story-layout/story-layout';
import { StoryList } from '../story-list/story-list';
import { StoryPage } from './story-page';

// Stubs keep this spec about where the children go, not about the children themselves.
@Component({
  selector: 'sa-story-layout',
  template: `<aside><ng-content select="[storySidebar]" /></aside>
    <main><ng-content select="[storyMain]" /></main>`,
})
class StubLayout {}

@Component({ selector: 'sa-story-list', template: 'list' })
class StubList {}

@Component({ selector: 'sa-child', template: 'child route' })
class Child {}

describe('StoryPage', () => {
  it('shows the list in the sidebar and the child route in the main area', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: StoryPage, children: [{ path: '', component: Child }] },
        ]),
      ],
    });
    TestBed.overrideComponent(StoryPage, {
      remove: { imports: [StoryLayout, StoryList] },
      add: { imports: [StubLayout, StubList] },
    });

    const harness = await RouterTestingHarness.create('/');
    const element = harness.routeNativeElement!;

    expect(element.querySelector('aside sa-story-list')).not.toBeNull();
    expect(element.querySelector('main')!.textContent).toContain('child route');
  });
});
