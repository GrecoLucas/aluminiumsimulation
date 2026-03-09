import * as THREE from 'three';

export const RAL_COLORS = [
    { name: 'RAL 1015', hex: '#E6D2B5', label: 'Marfim' },
    { name: 'RAL 3000', hex: '#AF2B1E', label: 'Vermelho Fogo' },
    { name: 'RAL 3005', hex: '#59191F', label: 'Vermelho Vinho' },
    { name: 'RAL 5010', hex: '#0E467F', label: 'Azul Gentiana' },
    { name: 'RAL 5013', hex: '#1C2B4A', label: 'Azul Cobalto' },
    { name: 'RAL 7011', hex: '#434B4D', label: 'Cinzento Ferro' },
    { name: 'RAL 7024', hex: '#45494E', label: 'Cinzento Grafite' },
    { name: 'RAL 7035', hex: '#D7D7D7', label: 'Cinzento Luz' },
    { name: 'RAL 8014', hex: '#493327', label: 'Castanho Sépia' },
    { name: 'RAL 8019', hex: '#3B3332', label: 'Castanho Cinzento' },
    { name: 'RAL 9005', hex: '#0A0A0A', label: 'Preto' },
    { name: 'RAL 6005', hex: '#2F4538', label: 'Verde Musgo' },
    { name: 'RAL 6020', hex: '#354031', label: 'Verde Óxido' },
    { name: 'RAL 9010', hex: '#FFFFFF', label: 'Branco Puro' }
];

export const METAL_COLORS = [
    { name: 'I5100', hex: '#D7C392', label: 'Texturado' },
    { name: 'GS150', hex: '#9CA69C', label: 'Texturado' },
    { name: 'GS900', hex: '#4E534E', label: 'Texturado' },
    { name: 'NS200', hex: '#222522', label: 'Texturado' },
    { name: 'NS900', hex: '#0D0D0D', label: 'Texturado' },
    { name: 'BS600', hex: '#3E4748', label: 'Texturado' },
    { name: 'VS500', hex: '#2D3D34', label: 'Texturado' },
    { name: 'BS650', hex: '#3F3529', label: 'Texturado' },
    { name: '7647', hex: '#454D4A', label: 'Texturado' },
    { name: 'TXGG', hex: '#313A3C', label: 'Texturado' },
    { name: 'Z.90', hex: '#444C55', label: 'Texturado' },
    { name: 'MARS', hex: '#4D3321', label: 'Texturado' },
    { name: 'MTZ9006', hex: '#A5AAB0', label: 'Metalizado' },
    { name: 'MTZ9007', hex: '#777B75', label: 'Metalizado' }
];

export class SceneModule {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Fundo cinza solicitado

        this.objects = {};
        this.lights = {};
        this.currentFinish = 'brilhante';
        this.autoRotate = false;

        // Estado da luz
        this.lightAngle = 0.78;
        this.lightHeight = 15;
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

        this.scene.add(this.lights.directional);
    }

    initObjects() {
        // Objeto em pé (vertical)
        const planeGeo = new THREE.BoxGeometry(6, 9, 0.3);
        const planeMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(0xe6d2b5),
            metalness: 0.1,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        this.objects.product = new THREE.Mesh(planeGeo, planeMat);
        this.objects.product.position.y = 4.5; // Metade da altura para ficar no chão
        this.objects.product.castShadow = true;
        this.objects.product.receiveShadow = true;
        this.scene.add(this.objects.product);

        // Chão (Cinza escuro para contraste)
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    setFinish(type) {
        this.currentFinish = type;
        const mat = this.objects.product.material;

        if (type === 'brilhante') {
            mat.roughness = 0.01; // Quase espelho
            mat.metalness = 0.1;
            mat.clearcoat = 1.0;
            mat.clearcoatRoughness = 0.01;
        } else if (type === 'mate') {
            mat.roughness = 0.85;
            mat.metalness = 0.0;
            mat.clearcoat = 0.0;
            mat.clearcoatRoughness = 0.0;
        } else if (type === 'metalizado') {
            mat.roughness = 0.15; // Metal polido mas com textura
            mat.metalness = 0.95;
            mat.clearcoat = 0.3;
            mat.clearcoatRoughness = 0.1;
        }
    }

    updateColor(hex) {
        if (this.objects.product) this.objects.product.material.color.set(hex);
    }

    updateAmbientIntensity(value) {
        if (this.lights.ambient) this.lights.ambient.intensity = value;
    }

    updateDirectionalIntensity(value) {
        if (this.lights.directional) this.lights.directional.intensity = value;
    }

    updateDirectionalPosition(angle) {
        this.lightAngle = angle;
        this._updateLightPos();
    }

    updateDirectionalHeight(height) {
        this.lightHeight = height;
        this._updateLightPos();
    }

    _updateLightPos() {
        if (this.lights.directional) {
            const radius = 15;
            this.lights.directional.position.x = Math.cos(this.lightAngle) * radius;
            this.lights.directional.position.z = Math.sin(this.lightAngle) * radius;
            this.lights.directional.position.y = this.lightHeight;
        }
    }

    updateRotation(delta) {
        if (this.autoRotate && this.objects.product) {
            this.objects.product.rotation.y += delta * 0.5;
        }
    }
}
