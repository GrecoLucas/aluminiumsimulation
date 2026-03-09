import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import GUI from 'lil-gui';
import { SceneModule, RAL_COLORS, METAL_COLORS } from './scene-module.js';

class App {
    constructor() {
        this.container = document.body;
        this.sceneModule = new SceneModule();
        this.clock = new THREE.Clock();

        // Parâmetros do GUI
        this.params = {
            // Modelo
            model: 'aluminum_profiles.glb',
            posX: 0, posY: 0, posZ: 0,
            rotX: 0, rotY: 0, rotZ: 0,
            scale: 1,

            // Material
            colorPreset: '#E6D2B5',
            customColor: '#E6D2B5',
            roughness: 0.3,
            metalness: 1,
            clearcoat: 0.0,
            clearcoatRoughness: 0.1,

            // Iluminação
            roomEnvironment: true,
            ambientIntensity: 0.5,
            ambientColor: '#ffffff',
            dirIntensity: 1.5,
            dirColor: '#ffffff',
            dirX: 10, dirY: 15, dirZ: 10,

            // Câmara
            autoRotate: false,
            resetCamera: () => this.resetCamera()
        };

        this.modelsList = {
            'Cubo (Teste)': 'primitive:cube',
            'Cilindro (Teste)': 'primitive:cylinder',
            'Esfera (Teste)': 'primitive:sphere',
            'Conection': 'conection.glb',
            'Aluminium profile single': 'cylinder.glb',
            'Machine Parts': 'machine_parts.glb',
            'Metalic Cube': 'metalic_cube.glb',
            'Spindle Bracket Holder': 'spindle_bracket_holder.glb',
            'Tubes': 'tubes.glb',
            'Aluminium profile': 'aluminum_profiles.glb'
        };

        this.init();
        this.setupGUI();
        this.loadInitialModel();
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

        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.roomEnvTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        this.sceneModule.scene.environment = this.roomEnvTexture;

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.resetCamera();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 60;
        this.controls.target.set(0, 5, 0);

        this.sceneModule.initLights();
        this.sceneModule.initEnvironment();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    resetCamera() {
        this.camera.position.set(15, 12, 18);
        if (this.controls) {
            this.controls.target.set(0, 5, 0);
            this.controls.update();
        }
    }

    loadInitialModel() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'block';

        this.sceneModule.loadModel(this.params.model, (prog) => {
            if (loadingEl) loadingEl.innerText = `A carregar modelo... ${Math.round(prog)}%`;
        }).then(() => {
            if (loadingEl) loadingEl.style.display = 'none';
            // Sincronizar painel com transformações do produto
            this.syncModelParams();
        }).catch(err => {
            if (loadingEl) loadingEl.innerText = 'Erro ao carregar modelo';
        });
    }

    syncModelParams() {
        this.params.posX = this.sceneModule.objects.product.position.x;
        this.params.posY = this.sceneModule.objects.product.position.y;
        this.params.posZ = this.sceneModule.objects.product.position.z;
        this.params.rotX = this.sceneModule.objects.product.rotation.x;
        this.params.rotY = this.sceneModule.objects.product.rotation.y;
        this.params.rotZ = this.sceneModule.objects.product.rotation.z;
        this.params.scale = this.sceneModule.objects.product.scale.x;

        if (this.guiControllers) {
            this.guiControllers.posX.updateDisplay();
            this.guiControllers.posY.updateDisplay();
            this.guiControllers.posZ.updateDisplay();
            this.guiControllers.rotX.updateDisplay();
            this.guiControllers.rotY.updateDisplay();
            this.guiControllers.rotZ.updateDisplay();
            this.guiControllers.scale.updateDisplay();
        }
    }

    setupGUI() {
        this.gui = new GUI({ title: 'Estúdio de Inspeção 3D' });
        this.guiControllers = {};

        // 📁 Modelo
        const folderModel = this.gui.addFolder('Modelo');
        folderModel.add(this.params, 'model', this.modelsList).name('Ficheiro GLB').onChange(v => {
            this.params.model = v;
            this.loadInitialModel();
        });

        this.guiControllers.posX = folderModel.add(this.params, 'posX', -20, 20).name('Posição X').onChange(v => this.sceneModule.objects.product.position.x = v);
        this.guiControllers.posY = folderModel.add(this.params, 'posY', -20, 20).name('Posição Y').onChange(v => this.sceneModule.objects.product.position.y = v);
        this.guiControllers.posZ = folderModel.add(this.params, 'posZ', -20, 20).name('Posição Z').onChange(v => this.sceneModule.objects.product.position.z = v);

        this.guiControllers.rotX = folderModel.add(this.params, 'rotX', -Math.PI, Math.PI).name('Rotação X').onChange(v => this.sceneModule.objects.product.rotation.x = v);
        this.guiControllers.rotY = folderModel.add(this.params, 'rotY', -Math.PI, Math.PI).name('Rotação Y').onChange(v => this.sceneModule.objects.product.rotation.y = v);
        this.guiControllers.rotZ = folderModel.add(this.params, 'rotZ', -Math.PI, Math.PI).name('Rotação Z').onChange(v => this.sceneModule.objects.product.rotation.z = v);

        this.guiControllers.scale = folderModel.add(this.params, 'scale', 0.1, 5).name('Escala Global').onChange(v => this.sceneModule.objects.product.scale.setScalar(v));
        // folderModel.open();

        const folderMat = this.gui.addFolder('Material');

        const allColors = { ...RAL_COLORS, ...METAL_COLORS };

        folderMat.add(this.params, 'colorPreset', allColors).name('Presets de Cor').onChange(v => {
            this.params.customColor = v;
            this.guiControllers.color.updateDisplay();
            this.sceneModule.material.color.set(v);
        });

        this.guiControllers.color = folderMat.addColor(this.params, 'customColor').name('Cor Personalizada').onChange(v => {
            this.sceneModule.material.color.set(v);
        });

        folderMat.add(this.params, 'roughness', 0, 1).name('Rugosidade').onChange(v => this.sceneModule.material.roughness = v);
        folderMat.add(this.params, 'metalness', 0, 1).name('Metalizado').onChange(v => this.sceneModule.material.metalness = v);
        folderMat.add(this.params, 'clearcoat', 0, 1).name('Verniz (Clearcoat)').onChange(v => this.sceneModule.material.clearcoat = v);
        folderMat.add(this.params, 'clearcoatRoughness', 0, 1).name('Rug. Verniz').onChange(v => this.sceneModule.material.clearcoatRoughness = v);

        // 📁 Iluminação
        const folderLight = this.gui.addFolder('Iluminação');
        folderLight.add(this.params, 'roomEnvironment').name('Reflexos Estúdio (HDRI)').onChange(v => {
            this.sceneModule.scene.environment = v ? this.roomEnvTexture : null;
            this.sceneModule.material.needsUpdate = true;
        });

        folderLight.add(this.params, 'ambientIntensity', 0, 3).name('Intens. Ambiente').onChange(v => this.sceneModule.lights.ambient.intensity = v);
        folderLight.addColor(this.params, 'ambientColor').name('Cor Ambiente').onChange(v => this.sceneModule.lights.ambient.color.set(v));

        folderLight.add(this.params, 'dirIntensity', 0, 5).name('Intens. Luz Dir.').onChange(v => this.sceneModule.lights.directional.intensity = v);
        folderLight.addColor(this.params, 'dirColor').name('Cor Luz Dir.').onChange(v => this.sceneModule.lights.directional.color.set(v));

        folderLight.add(this.params, 'dirX', -30, 30).name('Posição Luz X').onChange(v => { this.sceneModule.lights.directional.position.x = v; });
        folderLight.add(this.params, 'dirY', -30, 30).name('Posição Luz Y').onChange(v => { this.sceneModule.lights.directional.position.y = v; });
        folderLight.add(this.params, 'dirZ', -30, 30).name('Posição Luz Z').onChange(v => { this.sceneModule.lights.directional.position.z = v; });

        // 📁 Câmara
        const folderCam = this.gui.addFolder('Câmara');
        folderCam.add(this.params, 'autoRotate').name('Rotação Automática').onChange(v => {
            this.sceneModule.autoRotate = v;
        });
        folderCam.add(this.params, 'resetCamera').name('Centrar Câmara');
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
