// 使用着色器生成飞线
class FlyLineMesh {
    scene; //* 场景对象
    flyId; //id
    baicSpeed; //* 基础速度
    flyShader;
    texture; //* 图片
    attrs = {};
    flyArr = []; //* 浮现数组
  
    constructor(scene) {
      this.scene = scene;
      this.flyId = 0;
      this.baicSpeed = 1;
      this.texture = new BABYLON.Texture("texture/point.png", scene);
  
      // 编写着色器
      // 顶点着色器 通过传进来的u_index和position来函数进入的次数
      // gl_Position 计算像素位置
      // gl_PointSize 像素点大小 实现头大尾小的效果
      // 片段着色器
      // 计算像素颜色
      this.flyShader = {
        vertexshader: ` 
        uniform float size; 
        uniform float time; 
        uniform float u_len; 
        uniform mat4 worldViewProjection;
        attribute float u_index;
        attribute vec3 position;
        varying float u_opacitys;
  
        void main() {
            if( u_index < time + u_len && u_index > time){
                float u_scale = 1.0 - (time + u_len - u_index) /u_len;
                u_opacitys = u_scale;
                vec4 mvPosition = vec4(position, 1.0);
                gl_Position = worldViewProjection * mvPosition;
                gl_PointSize = size * u_scale;
            }
        }
              `,
        fragmentshader: ` 
        uniform sampler2D u_map;
        uniform vec3 color;
        uniform float u_opacity;
        uniform float isTexture;
        varying float u_opacitys;
  
        void main() {
          vec4 u_color = vec4(color,u_opacity * u_opacitys);
          if( isTexture != 0.0 ){
              gl_FragColor = u_color * texture2D(u_map, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
          }else{
              gl_FragColor = u_color;
          }
        }`,
      };
      BABYLON.Effect.ShadersStore[
        "customVertexShader"
      ] = this.flyShader.vertexshader;
      BABYLON.Effect.ShadersStore[
        "customFragmentShader"
      ] = this.flyShader.fragmentshader;
    }
  
    /**
     * [addFly description]
     *
     * @param   {String}  opt.color  [颜色_透明度]
     * @param   {Array}   opt.curve  [线的节点]
     * @param   {Number}  opt.width  [宽度]
     * @param   {Number}  opt.length [长度]
     * @param   {Number}  opt.speed  [速度]
     * @param   {Number}  opt.repeat [重复次数]
     * @return  {Mesh}               [return 图层]
     */
    addFly({
      color = "rgba(56, 168, 39,1)",
      curve = [],
      width = 3,
      length = 10,
      speed = 1,
      repeat = 1
    }) {
      // 获取线段的颜色
      let colorArr = this.getColorArr(color);
      // 添加着色器材质 根据attributes传入的position和u_index决定着色器进入次数
      // uniforms 设置着色器的属性 通过材质对象的set方法赋值 设置该值后如果着色器代码使用内置函数 也需要在此处声明
      let material = new BABYLON.ShaderMaterial(
        "myMaterial",
        this.scene,
        {
          vertex: "custom",
          fragment: "custom",
        },
        {
          attributes: ["position", "u_index"],
          uniforms: [
            "worldViewProjection",
            "color",
            "size",
            "u_len",
            "u_opacity",
            "time",
            "isTexture",
            "u_map"
          ],
        }
      );
      // 设置为粒子 需要设置该属性 gl_PointSize才会生效
      material.pointsCloud = true;
      // 设置uniforms 也可以通过设置属性来使着色器重新触发渲染
      material.setColor3("color", colorArr[0]);
      material.setFloat("size", 6);
      material.setFloat("u_len", length);
      material.setFloat("u_opacity", colorArr[1]);
      material.setFloat("time", -length);
      material.setTexture("u_map", this.texture)
      material.setFloat("isTexture", 1)
  
      // 设置attributes
      const position = new Float32Array(curve.length * 3);
      const u_index = new Float32Array(curve.length);
  
      let positionIndex = 0;
      curve.forEach(function(elem, index) {
        position[positionIndex] = elem.x;
        positionIndex++;
        position[positionIndex] = elem.y;
        positionIndex++;
        position[positionIndex] = elem.z;
        positionIndex++;
        u_index[index] = index;
      });
      // 创建一个mesh对象 使用该对象可以生成点
      var lines = new BABYLON.Mesh("lineMesh", this.scene);
      var vertexData = new BABYLON.VertexData();
      vertexData.positions = position;
      vertexData.applyToMesh(lines);
  
      lines.material = material;
      lines.name = "fly";
      lines.setVerticesData("position", position, false, 3);
      lines.setVerticesData("u_index", u_index, false, 1);
  
      (lines)._flyId = ++this.flyId;
      (lines)._speed = speed;
      (lines)._repeat = repeat;
      (lines)._been = 0;
      (lines)._total = curve.length;
      const flyId = lines._flyId;
      this.attrs[flyId] = { time: -length, length };
  
      this.flyArr.push(lines);
      return lines;
    }
  
    /**
     * [animation 动画]
     * @param   {Number}  delta  [执行动画间隔时间]
     */
    animation(delta = 0.015) {
      //间隔时间>0.2不出现动画
      if (delta > 0.2) return;
  
      // 跳
      this.flyArr.forEach((elem) => {
        // 大于它则为动画完结 删除
        if (elem._been > elem._repeat) {
          elem.visible = false;
          if (typeof elem._callback === "function") {
            elem._callback(elem);
          }
          this.remove(elem);
        } else {
          const effect = elem.material.getEffect();
          if (!effect) return;
          let time = this.attrs[elem._flyId].time;
          // 完结一次 如果小于total 添加再更改
          // console.log(time)
          if (time < elem._total) {
            let newTime = this.attrs[elem._flyId].time;
            time = newTime + delta * (this.baicSpeed / delta) * elem._speed;
            // time = newTime;
          } else {
            elem._been += 1;
            time = -this.attrs[elem._flyId].length;
          }
          this.attrs[elem._flyId].time = time;
          elem.material.setFloat("time", time);
        }
      });
    }
    /**
     * [remove 删除]
     * @param   {Object}  mesh  [当前飞线]
     */
    remove(mesh) {
      // mesh.material.dispose();
      // mesh.geometry.dispose();
      this.flyArr = this.flyArr.filter((elem) => elem._flyId != mesh._flyId);
      mesh.parent.remove(mesh);
      mesh = null;
    }
  
    color(c) {
      if (!c) return new BABYLON.Color3();
      return BABYLON.Color3.FromHexString(c);
    }
    getColorArr(str) {
      if (Array.isArray(str)) return str; //error
      var _arr = [];
      str = str + "";
      str = str.toLowerCase().replace(/\s/g, "");
      if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
        var arr = str.replace(/rgba\(|\)/gi, "").split(",");
        var hex = [
          pad2(Math.round((arr[0]) * 1 || 0).toString(16)),
          pad2(Math.round((arr[1]) * 1 || 0).toString(16)),
          pad2(Math.round((arr[2]) * 1 || 0).toString(16)),
        ];
        _arr[0] = this.color("#" + hex.join(""));
        _arr[1] = Math.max(
          0,
          Math.min(1, (arr[3] ) * 1 || 0)
        );
      } else if ("transparent" === str) {
        _arr[0] = this.color();
        _arr[1] = 0;
      } else {
        _arr[0] = this.color(str);
        _arr[1] = 1;
      }
  
      function pad2(c) {
        return c.length == 1 ? "0" + c : "" + c;
      }
      return _arr;
    }
  }
  
  export default FlyLineMesh;
  