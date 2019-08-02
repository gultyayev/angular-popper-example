import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2
} from "@angular/core";
import Popper, { Placement, PopperOptions } from "popper.js";
import { fromEvent, merge, Subject } from "rxjs";
import { filter, pluck, takeUntil } from "rxjs/operators";

@Directive({
  selector: "[appPopper]"
})
export class PopperDirective implements OnInit, OnDestroy {
  // The hint to display
  @Input() target: HTMLElement;
  // Its positioning (check docs for available options)
  @Input() placement?: Placement;
  // Optional hint target if you desire using other element than specified one
  @Input() appPopper?: HTMLElement;
  // The popper instance
  private popper: Popper;
  private readonly defaultConfig: PopperOptions = {
    placement: "top",
    removeOnDestroy: true,
    modifiers: {
      arrow: {
        element: ".popper__arrow"
      }
    },
    eventsEnabled: false
  };
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // An element to position the hint relative to
    const reference = this.appPopper ? this.appPopper : this.el.nativeElement;

    this.popper = new Popper(reference, this.target, {
      ...this.defaultConfig,
      placement: this.placement || this.defaultConfig.placement
    });

    this.renderer.setStyle(this.target, "display", "none");

    merge(
      fromEvent(reference, "mouseenter"),
      fromEvent(reference, "mouseleave")
    )
      .pipe(
        filter(() => this.popper != null),
        pluck("type"),
        takeUntil(this.destroy$)
      )
      .subscribe((e: any) => this.mouseHoverHandler(e));
  }

  ngOnDestroy(): void {
    if (!this.popper) {
      return;
    }

    this.popper.destroy();

    this.destroy$.next();
    this.destroy$.complete();
  }

  private mouseHoverHandler(e: string): void {
    if (e === "mouseenter") {
      this.renderer.removeStyle(this.target, "display");
      this.popper.enableEventListeners();
      this.popper.scheduleUpdate();
    } else {
      this.renderer.setStyle(this.target, "display", "none");
      this.popper.disableEventListeners();
    }
  }
}
