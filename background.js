/**
 * Created by jerry on 2016/4/16.
 */
(function () {
    var camera, scene, renderer, controller, light, material,end, spriteMaterial = [];

    function initScene() {
        scene = new THREE.Scene();
    }

    function initCamera() {
        camera = new THREE.PerspectiveCamera(45, 4/3, 1, 1000);
        camera.position.z = -200;
        camera.position.x = 0;
        camera.position.y = 0;
        camera.lookAt({
            x: 0,
            y: 0,
            z: 0
        });
        scene.add(camera);
    }

    function initRenderer() {
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        // renderer.setClearColor(0xFFFFFF);
        renderer.setSize(800, 600);
        document.getElementById('background').appendChild(renderer.domElement);
    }

    function initLight() {
        var allLight = new THREE.AmbientLight(0xffffff, 1);
        light = new THREE.DirectionalLight(0xffffff, 2.0);
        light.position.set(-100, 0, 0);
        scene.add(light);
        scene.add(allLight);
    }

    function initPoint() {
        var texture = new THREE.Texture(generateSprite('rgba(255,255,255,1)','rgba(0,255,255,1)' ,'rgba(0,0,64,1)' , 'rgba(0,0,0,1)'));
        spriteMaterial.push(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true
        }));
        texture.needsUpdate = true;

        texture = new THREE.Texture(generateSprite('rgba(255,255,255,1)','rgba(215,202,153,1)' ,'rgba(215,202,153,1)' , 'rgba(0,0,0,1)'));
        spriteMaterial.push(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true
        }));
        texture.needsUpdate = true;

        texture = new THREE.Texture(generateSprite('rgba(255,255,255,1)','rgba(98,90,5,1)' ,'rgba(98,90,5,1)' , 'rgba(0,0,0,1)'));
        spriteMaterial.push(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true
        }));
        texture.needsUpdate = true;

        texture = new THREE.Texture(generateSprite('rgba(255,255,255,1)','rgba(230,28,100,1)' ,'rgba(230,28,100,1)' , 'rgba(0,0,0,1)'));
        spriteMaterial.push(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true
        }));
        texture.needsUpdate = true;

        texture = new THREE.Texture(generateSprite('rgba(255,255,255,1)','rgba(0,0,0,1)' ,'rgba(0,0,0,1)' , 'rgba(0,0,0,1)'));
        spriteMaterial.push(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true
        }));
        texture.needsUpdate = true;
    }

    function initController() {
        controller = new THREE.TrackballControls(camera, renderer.domElement);
        scene.add(controller)
    }

    function initParticle(particle, delay) {

        var particle = this instanceof THREE.Sprite ? this : particle;
        var delay = delay !== undefined ? delay : 0;

        particle.position.set(0, 0, 0);
        particle.scale.x = particle.scale.y = Math.random() * 5 + 5;

        new TWEEN.Tween(particle)
            .delay(delay)
            .to({}, 500)
            .onComplete(function(){
                if(end == 0){
                    initParticle(particle, delay)
                }
            })
            .start();
        new TWEEN.Tween(particle.position)
            .delay(delay)
            .to({x: Math.random() * 50, y: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 5}, 500)
            .start();
        new TWEEN.Tween(particle.scale)
            .delay(delay)
            .to({x: 0, y: 0}, 500)
            .start();
    }

    function initAnimate() {
        // var timer = 0.0001 * Date.now();
        // time += 0.001;
        TWEEN.update();
        // controller.update();
        // m.emissive.setHSL(0.54, 1, 0.35 * ( 0.5 + 0.5 * Math.sin(35 * timer)));
        renderer.render(scene, camera);
        requestAnimationFrame(initAnimate)
    }

    function generateSprite(color1,color2,color3,color4) {

        var canvas = document.createElement( 'canvas' );
        canvas.width = 16;
        canvas.height = 16;

        var context = canvas.getContext( '2d' );
        var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
        gradient.addColorStop( 0, color1);
        gradient.addColorStop( 0.2, color2);
        gradient.addColorStop( 0.4, color3);
        gradient.addColorStop( 1, color4);

        context.fillStyle = gradient;
        context.fillRect( 0, 0, canvas.width, canvas.height );

        return canvas;
    }

    function breakAction(particle) {
        particle.position.set(0,0,0);
        particle.scale.x = particle.scale.y = Math.random() * 10 + 10;
        var a = Math.random();
        new TWEEN.Tween(particle.position)
            .to({
                x: Math.random() * 100,
                y: (Math.sin(100*a) - 0.5) * 100,
                z: (Math.cos(100*a) - 0.5) * 100
            }, 5000)
            .start();
        new TWEEN.Tween(particle.scale)
            .to({x: 0, y: 0}, 1000)
            .start();
    }

    initScene();
    initCamera();
    initRenderer();
    initPoint();
    initController();
    initAnimate();

    window.sprite = function (point1, point2,color, number, arriveTime, callback) {
        var object = new THREE.Object3D();
        end = 0;
        for (var i = 0; i < number; i++) {
            var particle = new THREE.Sprite(spriteMaterial[color]);
            initParticle(particle, i * 10);
            object.add(particle)
        }
        var dx = -(point2.x - point1.x);
        var dy = point2.y - point1.y;

        var o = Math.atan2(dy, dx);
        object.rotation.z = -o;
        object.position.set(point1.x, point1.y, 0);
        new TWEEN.Tween(object.position)
            .to({x: point2.x, y: point2.y}, arriveTime)
            .onComplete(function () {

                end = 1;
                setTimeout(function () {
                    for (var i = 0;i < number; i ++) {
                        breakAction(object.children[i]);
                    }

                    setTimeout(function () {
                        scene.remove(object)
                    },5000);
                    callback();
                }, 300);

            })
            .start();

        scene.add(object);
    }

})();
