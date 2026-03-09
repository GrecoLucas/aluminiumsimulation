import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const RAL_COLORS = {
    'RAL 1015 (Marfim)': '#E6D2B5',
    'RAL 3000 (Vermelho Fogo)': '#AF2B1E',
    'RAL 3005 (Vermelho Vinho)': '#59191F',
    'RAL 5010 (Azul Gentiana)': '#0E467F',
    'RAL 5013 (Azul Cobalto)': '#1C2B4A',
    'RAL 7011 (Cinzento Ferro)': '#434B4D',
    'RAL 7024 (Cinzento Grafite)': '#45494E',
    'RAL 7035 (Cinzento Luz)': '#D7D7D7',
    'RAL 8014 (Castanho Sépia)': '#493327',
    'RAL 8019 (Castanho Cinzento)': '#3B3332',
    'RAL 9005 (Preto)': '#0A0A0A',
    'RAL 6005 (Verde Musgo)': '#2F4538',
    'RAL 6020 (Verde Óxido)': '#354031',
    'RAL 9010 (Branco Puro)': '#FFFFFF'
};

export const METAL_COLORS = {
    'I5100 (Texturado)': '#D7C392',
    'GS150 (Texturado)': '#9CA69C',
    'GS900 (Texturado)': '#4E534E',
    'NS200 (Texturado)': '#222522',
    'NS900 (Texturado)': '#0D0D0D',
    'BS600 (Texturado)': '#3E4748',
    'VS500 (Texturado)': '#2D3D34',
    'BS650 (Texturado)': '#3F3529',
    '7647 (Texturado)': '#454D4A',
    'TXGG (Texturado)': '#313A3C',
    'Z.90 (Texturado)': '#444C55',
    'MARS (Texturado)': '#4D3321',
    'MTZ9006 (Metalizado)': '#A5AAB0',
    'MTZ9007 (Metalizado)': '#777B75'
};

export class SceneModule {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        this.objects = {
            product: new THREE.Group() // Container wrapper para o modelo carregado
        };
        this.scene.add(this.objects.product);

        this.lights = {};
        this.autoRotate = false;
        
        // Base Material Fotorrealista para os modelos carregados
        this.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#FFFFFF'),
            metalness: 0.1,
            roughness: 0.3,
            clearcoat: 0.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        this.gltfLoader = new GLTFLoader();
        this.currentLoadedModel = null;
    }

    initLights() {
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.lights.ambient);

        this.lights.directional = new THREE.DirectionalLight(0xffffff, 1.5);
        this.lights.directional.position.set(10, 15, 10);
        this.lights.directional.castShadow = true;

        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 40;
        this.lights.directional.shadow.camera.left = -15;
        this.lights.directional.shadow.camera.right = 15;
        this.lights.directional.shadow.camera.top = 15;
        this.lights.directional.shadow.camera.bottom = -15;
        this.lights.directional.shadow.bias = -0.001;

        this.scene.add(this.lights.directional);
    }

    initEnvironment() {
        // Chão de estúdio (Cinza escuro para contraste)
        const floorGeo = new THREE.PlaneGeometry(200, 200);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        const grid = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        grid.position.y = 0.01;
        this.scene.add(grid);
    }

    async loadModel(filename, onProgress) {
        if (!filename) return;

        return new Promise((resolve, reject) => {
            if (this.currentLoadedModel) {
                this.objects.product.remove(this.currentLoadedModel);
            }

            this.gltfLoader.load(
                `./assets/${filename}`,
                (gltf) => {
                    this.currentLoadedModel = gltf.scene;

                    // Centralizar o modelo
                    const box = new THREE.Box3().setFromObject(this.currentLoadedModel);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // Normalizar a escala se for demasiado grande ou pequeno
                    const maxDim = Math.max(size.x, size.y, size.z);
                    let scale = 1;
                    if (maxDim > 20) scale = 15 / maxDim;
                    else if (maxDim < 1) scale = 5 / maxDim;
                    
                    this.currentLoadedModel.scale.setScalar(scale);
                    
                    // Reposicionar para o centro na base Y=0 local do product
                    this.currentLoadedModel.position.x = -center.x * scale;
                    this.currentLoadedModel.position.y = -center.y * scale + (size.y * scale) / 2;
                    this.currentLoadedModel.position.z = -center.z * scale;

                    // Aplicar material unificado e sombras
                    this.currentLoadedModel.traverse((child) => {
                        if (child.isMesh) {
                            child.material = this.material;
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    this.objects.product.add(this.currentLoadedModel);
                    
                    // Fazer reset das transformações do grupo `product`
                    this.objects.product.position.set(0, 0, 0);
                    this.objects.product.rotation.set(0, 0, 0);
                    this.objects.product.scale.set(1, 1, 1);

                    resolve(this.currentLoadedModel);
                },
                (xhr) => {
                    if (onProgress) onProgress((xhr.loaded / xhr.total) * 100);
                },
                (error) => {
                    console.error('Erro a carregar o modelo', error);
                    reject(error);
                }
            );
        });
    }

    updateRotation(delta) {
        if (this.autoRotate && this.objects.product) {
            this.objects.product.rotation.y += delta * 0.5;
        }
    }
}
