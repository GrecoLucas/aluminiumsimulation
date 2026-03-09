import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SceneModule, RAL_COLORS, METAL_COLORS } from './scene-module.js';

class App {
    constructor() {
        this.container = document.body;
        this.sceneModule = new SceneModule();
        this.clock = new THREE.Clock();

        this.init();
        this.setupUI();
        this.animate();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        // Environment (Reflexos realistas)
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.sceneModule.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(12, 10, 12);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;

        this.sceneModule.initLights();
        this.sceneModule.initObjects();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupUI() {
        // Sliders de Luz
        const ambientSlider = document.getElementById('ambient-intensity');
        const directionalSlider = document.getElementById('directional-intensity');

        ambientSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('ambient-val').innerText = val.toFixed(1);
            this.sceneModule.updateAmbientIntensity(val);
        });

        directionalSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('directional-val').innerText = val.toFixed(1);
            this.sceneModule.updateDirectionalIntensity(val);
        });

        document.getElementById('light-position').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.sceneModule.updateDirectionalPosition(val);
        });

        document.getElementById('light-height').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.sceneModule.updateDirectionalHeight(val);
        });

        // Gerar Swatches de Cores RAL
        const swatchGrid = document.getElementById('swatch-grid');

        const createSwatch = (color) => {
            const button = document.createElement('button');
            button.className = 'swatch';
            button.style.backgroundColor = color.hex;
            button.title = `${color.name} - ${color.label}`;
            button.addEventListener('click', () => {
                this.sceneModule.updateColor(color.hex);
                document.getElementById('current-color-name').innerText = color.name;
                document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                button.classList.add('active');
            });
            return button;
        };

        RAL_COLORS.forEach(color => swatchGrid.appendChild(createSwatch(color)));

        // Adicionar separador ou título para Cores Metalizadas
        const metalTitle = document.createElement('span');
        metalTitle.className = 'section-title';
        metalTitle.style.gridColumn = '1 / -1';
        metalTitle.style.marginTop = '10px';
        metalTitle.innerText = 'Texturados & Metalizados';
        swatchGrid.appendChild(metalTitle);

        METAL_COLORS.forEach(color => swatchGrid.appendChild(createSwatch(color)));

        // Acabamento (Brilhante vs Mate vs Metalizado)
        document.getElementById('btn-brilhante').addEventListener('click', (e) => {
            this.sceneModule.setFinish('brilhante');
            document.querySelectorAll('.finish-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });

        document.getElementById('btn-mate').addEventListener('click', (e) => {
            this.sceneModule.setFinish('mate');
            document.querySelectorAll('.finish-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });

        document.getElementById('btn-metalizado').addEventListener('click', (e) => {
            this.sceneModule.setFinish('metalizado');
            document.querySelectorAll('.finish-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });

        // Auto-rotação
        document.getElementById('toggle-rotation').addEventListener('change', (e) => {
            this.sceneModule.autoRotate = e.target.checked;
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();

        this.controls.update();
        this.sceneModule.updateRotation(delta);
        this.renderer.render(this.sceneModule.scene, this.camera);
    }
}

new App();
