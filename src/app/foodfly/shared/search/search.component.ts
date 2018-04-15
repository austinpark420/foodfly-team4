// observable-event-http.component
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ToastService } from '../../core/services/toast.service';

import { environment } from '../../../../environments/environment';

// Observable operators
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

@Component({
  selector: 'foodfly-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})

export class SearchComponent implements OnInit, OnDestroy {
  clickStatus = false;
  subscription: Subscription;
  inputText: FormControl = new FormControl('');

  // 검색 결과에 맞는 주소 데이터 저장
  listAddress: Object;

  // geo 현재 주소 데이터
  geoCurrentData;

  // 도로명 주소 url, api id 가져오기
  roadApiUrl = `${environment.roadApiUrl}`;
  roadAddressAppId = `${environment.roadAddressAppId}`;

  // 구글 api 주소 url, api id 가져오기
  googleApiUrl = `${environment.googleApiUrl}`;
  googleMapAppId = `${environment.googleMapAppId}`;

  constructor(public http: HttpClient, private router: Router, private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.inputText.valueChanges
      // 딜레이 타임
      .debounceTime(500)
      .switchMap(InputValue => this.getInputData(InputValue))
      .subscribe(AddressData => { this.listAddress = AddressData; });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // input 값이 변경시 실행
  getInputData(searchText: string): Observable<any> {

    const params = new HttpParams()
      .set('keyword', searchText)
      .set('confmKey', this.roadAddressAppId)
      .set('resultType', 'json');

    return this.http
      .get<any>( this.roadApiUrl , { params })
      .map(data => {
        // 주소 값을 넣는 변수 선언
        const AddressGetData = data.results.juso;

        if (!AddressGetData || !AddressGetData.length) { return; }

        return this.setGeoData(AddressGetData);
      })
      .do(console.log)
      .catch(err => {
        if (err.status === 404) {
          console.log(`[ERROR] Not found user:`);
          return Observable.of<any>(err);
        } else {
          throw err;
        }
      });
  }

  // 주소 값을 좌표로 변환
  getGeoData(addressData) {
    const params = new HttpParams()
      .set('address', addressData)
      .set('key', this.googleMapAppId);

    this.http.get<any>( this.googleApiUrl , { params })
      .subscribe(data => {
        // 검색 결과가 없을시 나가기
        if (!data.results.length) { return; }

        // 결과 좌표 값을 가지고 나가기
        return this.geoCurrentData = data.results[0].geometry.location;
      });
  }

  // 검색한 결과에 맞는 주소 저장
  setGeoData(AddressGetData) {
    console.log(AddressGetData);
    // 검색한 주소 결과 저장
    let setData = [];

    // 주소 정보롤 좌표 값 가져오기
    this.getGeoData(AddressGetData[0].roadAddr);

    // 주소 정보 가져와서 필요한 값만 저장
    AddressGetData.map(jusoData => {

      setData = [...setData, {
        'roadAddrPart1': jusoData.roadAddrPart1,
        'jibunAddr': jusoData.jibunAddr
      }];

    });
    return setData;
  }

  // 좌표 가지고 주소 찾기
  getAddressData(lat, lng) {
    const params = new HttpParams()
      .set('latlng', `${lat}, ${lng}`)
      .set('key', this.googleMapAppId);

    this.http.get<any>( this.googleApiUrl , { params })
      .subscribe(data => {
        // 결과 주소 값
        const dataAddress = data.results[0].formatted_address;

        // 결과 주소 값에 앞에 '대한민국'으로 시작하는 것을 빼줌
        return this.inputText.setValue(dataAddress.substring(5, dataAddress.length));
      });
  }

  // 현재 주소 값 가져오기
  getCurrentGeo() {
    // scope this 받기
    const that = this;

    // geo 옵션 설정
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000
    };

    // 브라우저 navigator.geolocation을 지원 확인
    if (!navigator.geolocation) {
      this.toastService.messageAdd('사용자의 브라우저는 지오로케이션을 지원하지 않습니다.', 'warning');
      return;
    }

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);

    // 좌표 정보 얻기 성공
    function geoSuccess(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // 좌표 값 가지고 Address 바꾸기
      that.getAddressData(lat, lng);

      // 현재 좌표를 가지고 페이지 이동
      // that.router.navigate([`restaurant/foodlist/${lat}/${lng}`]);

      // 임시
      // 진행되는 과정을 보여주기 위해 setTimeout 함수 사용
      setTimeout(() => {
        that.router.navigate([`restaurant/foodlist/${lat}/${lng}`]);
      }, 2000);
    }

    // 좌표 정보 얻기 실패
    function geoError() {
      that.toastService.messageAdd('위치를 찾을 수 없습니다.', 'warning');
    }
  }

  editInputValue(addressValue, addressData) {
    if (addressValue.nodeName === 'STRONG') {
      this.inputText.setValue(addressValue.textContent);

      // this.router.navigate([`restaurant/foodlist/${this.geoCurrentData.lat}/${this.geoCurrentData.lng}`]);

      // 임시
      // 진행되는 과정을 보여주기 위해 setTimeout 함수 사용
      setTimeout(() => {
        this.router.navigate([`restaurant/foodlist/${this.geoCurrentData.lat}/${this.geoCurrentData.lng}`]);
      }, 2000);

    } else {
      this.inputText.setValue(addressValue.children[0].textContent);

      // this.router.navigate([`restaurant/foodlist/${this.geoCurrentData.lat}/${this.geoCurrentData.lng}`]);

      // 임시
      // 진행되는 과정을 보여주기 위해 setTimeout 함수 사용
      setTimeout(() => {
        this.router.navigate([`restaurant/foodlist/${this.geoCurrentData.lat}/${this.geoCurrentData.lng}`]);
      }, 2000);
    }
    this.clickStatus = false;
  }

  findFoodList() {
    console.log('들어왔다');
  }

  cleanInputValue() {
    this.inputText.setValue('');
  }
}
