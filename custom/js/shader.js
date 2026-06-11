/* shader.js — ZeBest Custom hero WebGL animation (Three.js r128) */
(function () {
    'use strict';

    var canvas = document.getElementById('shader-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var vertexShader = [
        'void main() {',
        '    gl_Position = vec4(position, 1.0);',
        '}'
    ].join('\n');

    /* Fragment shader adapté fond blanc :
       lignes iridescentes inversées — couleurs douces sur blanc */
    var fragmentShader = [
        'precision highp float;',
        'uniform vec2  resolution;',
        'uniform float time;',
        '',
        'void main(void) {',
        '    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);',
        '    float t = time * 0.022;',
        '    float lw = 0.0028;',
        '',
        '    vec3 color = vec3(0.0);',
        '    for (int j = 0; j < 3; j++) {',
        '        for (int i = 0; i < 5; i++) {',
        '            color[j] += lw * float(i * i)',
        '                / abs(fract(t - 0.01 * float(j) + float(i) * 0.012) * 5.0',
        '                      - length(uv)',
        '                      + mod(uv.x + uv.y, 0.2));',
        '        }',
        '    }',
        '',
        '    /* Inversion pour fond blanc — lignes iridescentes douces */',
        '    vec3 final = vec3(1.0) - clamp(color, 0.0, 1.0) * 0.42;',
        '    gl_FragColor = vec4(final, 1.0);',
        '}'
    ].join('\n');

    var renderer, uniforms, animId;

    try {
        var camera = new THREE.Camera();
        camera.position.z = 1;

        var scene    = new THREE.Scene();
        var geometry = new THREE.PlaneGeometry(2, 2);

        uniforms = {
            time:       { type: 'f',  value: 1.0 },
            resolution: { type: 'v2', value: new THREE.Vector2() }
        };

        var material = new THREE.ShaderMaterial({
            uniforms:       uniforms,
            vertexShader:   vertexShader,
            fragmentShader: fragmentShader
        });

        scene.add(new THREE.Mesh(geometry, material));

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        function resize() {
            var hero = document.getElementById('hero');
            var w = hero ? hero.clientWidth  : window.innerWidth;
            var h = hero ? hero.clientHeight : window.innerHeight;
            renderer.setSize(w, h);
            uniforms.resolution.value.set(
                renderer.domElement.width,
                renderer.domElement.height
            );
        }

        resize();
        window.addEventListener('resize', resize, { passive: true });

        function animate() {
            animId = requestAnimationFrame(animate);
            uniforms.time.value += 0.038;
            renderer.render(scene, camera);
        }

        animate();

    } catch (e) {
        /* WebGL non disponible — le fond blanc CSS reste visible */
        console.warn('ZBC shader: WebGL indisponible', e);
    }
})();
