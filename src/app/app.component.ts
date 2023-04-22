import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from './services/api.service';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  switchMap,
  finalize,
  tap,
  debounceTime,
  delay,
  startWith,
} from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;
  itemSize = 50;
  _limit: BehaviorSubject<number | null | string> = new BehaviorSubject<
    number | null | string
  >(10);
  _start: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  title_like: BehaviorSubject<string | null | string> = new BehaviorSubject<
    string | null | string
  >('');
  _isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  _isLoadingSearch: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  vm$: Observable<any> | null = null;
  items = Array.from({ length: 100000 }).map((_, i) => `Item #${i}`);
  index = 0;
  data: BehaviorSubject<any> = new BehaviorSubject<any>([]);

  search = new FormControl('');

  searchedWords$: Observable<string[] | null | undefined> =
    this.search.valueChanges.pipe(
      map((search: string | null) => (search ? search.trim().split(' ') : null))
    );

  constructor(private api: ApiService) {
    combineLatest([this._start, this._limit, this.title_like])
      .pipe(
        map(([_start, _limit, title_like]) => {
          return {
            _start,
            _limit,
            title_like,
          };
        }),
        switchMap((val) => {
          this._isLoading.next(true);

          return this.api.getPhotos(val).pipe(
            delay(500),
            finalize(() => {
              this._isLoading.next(false);
              this._isLoadingSearch.next(false);
            })
          );
        })
      )
      .subscribe((val) => {
        console.log(val);

        this.data.next(val);
      });

    // this.vm$.subscribe(console.log);
  }

  ngOnInit() {
    this.search.valueChanges
      .pipe(
        debounceTime(500),
        tap((val) => {
          this.viewPort.scrollTo({
            top: 0,
          });
          this.index = 1;
          this.data.next([]);
          this._isLoadingSearch.next(true);
          this.title_like.next(val);
          this._limit.next(10);
        })
      )
      .subscribe(() => {});

    // this.search.valueChanges
    //   .pipe(
    //     debounceTime(500),
    //     switchMap((val) => {
    //       this._isLoadingSearch.next(true);
    //       return this.api
    //         .getPhotos({ _limit: 10, _start: 5, title_like: val })
    //         .pipe(
    //           delay(500),
    //           finalize(() => this._isLoadingSearch.next(false))
    //         );
    //     })
    //   )
    //   .subscribe((val) => (this.data = val));
  }

  trackByIdx(i: number) {
    return i;
  }

  currentIndex(idx: number) {
    if (idx === this.viewPort.getDataLength() - 5 && idx > this.index) {
      console.log('run call api ' + idx);
      this.index = idx;
      this._limit.next(this._limit.value && +this._limit.value + 10);
    }
  }
}
