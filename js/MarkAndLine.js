import { pointData, flyLineData } from "../storage/MarkAndLine.js";
import { addFlyLine } from "./AddFlyLine.js";
import FlyLineMesh from "./FlyLineMesh.js";
import { createPoint } from "./Marker.js";

// 3D地球的Marker特效和飞线显示特效
class MarkAndLine {
  scene; //场景对象
  earthRadius;
  flyLineMesh;
  waveMeshs = [];
  pointMeshs = [];
  constructor(scene, earthRadius) {
    this.scene = scene;
    this.earthRadius = earthRadius;
    this.flyLineMesh = new FlyLineMesh(scene);
  }
  init() {
    //* 初始化方法
    if (!pointData || !flyLineData) return;

    this._createPoints(pointData); // 生成标注点
    this._createFlyLines(pointData, flyLineData); // 生成飞线
    this.flyLineMesh.animation();
  }
  updateAnimation() {
    // 更新光圈动画
    this._waveAnimate();
    this.flyLineMesh.animation()
  }

  /**
   * 生成飞线数据
   * @param pointData 标注点列表
   * @param flyLineData 飞线列表
   */
  _createFlyLines(pointData, flyLineData) {
    for (var i = 0; i < flyLineData.length; i++) {
      var flyLine = flyLineData[i];
      const from = pointData[flyLine.from];
      if (!from) continue;
      for (var j = 0; j < flyLine.to.length; j++) {
        const to = pointData[flyLine.to[j]];
        if (!to) continue;
        const lineObj = addFlyLine(from, to, this.flyLineMesh);
        // this.linesMeshs.push(lineObj.lineMesh);
      }
    }
  }
  /**
   * 生成标注点
   * @param pointData
   */
  _createPoints(pointData) {
    for (const pointName in pointData) {
      const pointObj = createPoint(
        this.scene,
        pointData[pointName],
        this.earthRadius
      );
      this.waveMeshs.push(pointObj.wavePlane);
      this.pointMeshs.push(pointObj.pointPlane);
    }
  }
  /**
   * 光圈动画 将需要进行动画的光圈传入
   */
  _waveAnimate() {
    // 所有波动光圈都有自己的透明度和大小状态
    // 一个波动光圈透明度变化过程是：0~1~0反复循环
    this.waveMeshs.forEach(function (mesh) {
      mesh._s += 0.007;
      mesh.scaling = new BABYLON.Vector3(
        mesh.size * mesh._s,
        mesh.size * mesh._s,
        mesh.size * mesh._s
      );
      if (mesh._s <= 1.5) {
        mesh.material.alpha = (mesh._s - 1) * 2; //2等于1/(1.5-1.0)，保证透明度在0~1之间变化
      } else if (mesh._s > 1.5 && mesh._s <= 2) {
        mesh.material.alpha = 1 - (mesh._s - 1.5) * 2; //2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
      } else {
        mesh._s = 1.0;
      }
    });
  }
}

export default MarkAndLine;
