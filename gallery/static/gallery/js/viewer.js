// 1. Импортируем Three.js по имени из Import Map
import * as THREE from 'three';
// Подключаем "грузчика" для формата GLB
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 2. Экспортируем главную функцию
// Она принимает ID HTML-элемента, в который нужно вставить 3D
export function loadModel(containerId, modelUrl) {
    console.log("🚀 loadModel ВЫЗВАНА для контейнера:", containerId);
    console.log("🔗 URL модели:", modelUrl);
    
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Стандартная настройка сцены
    const scene = new THREE.Scene();
    
    // ✅ ИСПРАВЛЕНИЕ: Явный цвет фона сцены
    scene.background = new THREE.Color(0xf0f0f0);

    // Тестовый красный куб для проверки рендеринга (можно убрать после отладки)
    const testCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    testCube.position.set(0, 1, 0);
    scene.add(testCube);
    console.log("🔴 Тестовый куб добавлен");

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // ✅ ИСПРАВЛЕНИЕ: alpha: false — отключаем прозрачность канваса
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // --- НАСТРОЙКИ ЦВЕТА ---
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // ✅ ИСПРАВЛЕНИЕ: Стили для канваса, чтобы он не перекрывался
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'relative';
    renderer.domElement.style.zIndex = '1';

    // Очищаем контейнер и вставляем Canvas
    container.innerHTML = '';
    container.style.position = 'relative'; // Для позиционирования лоадера
    container.appendChild(renderer.domElement);

    // --- УПРАВЛЕНИЕ ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.1;
    controls.maxDistance = 100;

    // --- СВЕТ И ОКРУЖЕНИЕ ---
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const roomEnvironment = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvironment).texture;
    
    // ✅ Окружение только для освещения и отражений (не для фона)
    scene.environment = envTexture;
    // scene.background уже задан цветом выше

    // --- ЛОАДЕР (интерфейс загрузки) ---
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader-overlay';
    loaderDiv.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: rgba(240, 240, 240, 0.9);
        z-index: 10;
        transition: opacity 0.3s ease;
    `;
    loaderDiv.innerHTML = `
        <div style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">Loading...</div>
        <div class="progress-bar" style="width: 200px; height: 4px; background: #ddd; border-radius: 2px;">
            <div class="progress-fill" style="width: 0%; height: 100%; background: #4CAF50; border-radius: 2px; transition: width 0.1s;"></div>
        </div>
    `;
    container.appendChild(loaderDiv);
    const progressFill = loaderDiv.querySelector('.progress-fill');

    // --- ЗАГРУЗКА МОДЕЛИ ---
    const loader = new GLTFLoader();

    loader.load(
        modelUrl,

        // A. ON LOAD (Успех)
        (gltf) => {
            const model = gltf.scene;
            
            // ✅ ИСПРАВЛЕНИЕ: Обработка материалов для корректной прозрачности
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                            mat.envMapIntensity = 1.0;
                            if (mat.transparent) {
                                mat.depthWrite = false;
                                mat.side = THREE.DoubleSide;
                            }
                        }
                    });
                }
            });

            // Центрируем камеру на модели
            fitCameraToObject(camera, model, controls, 1.5);
            
            // Убираем тестовый куб, если модель загрузилась
            scene.remove(testCube);
            
            scene.add(model);

            // Скрываем лоадер
            loaderDiv.style.opacity = '0';
            setTimeout(() => {
                loaderDiv.remove();
            }, 300);
            
            console.log("✅✅✅ МОДЕЛЬ УСПЕШНО ЗАГРУЖЕНА!");
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            console.log("📐 Размеры модели:", size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
        },

        // B. ON PROGRESS (Прогресс)
        (xhr) => {
            if (xhr.total > 0) {
                const percent = (xhr.loaded / xhr.total) * 100;
                progressFill.style.width = percent + '%';
            }
        },

        // C. ON ERROR (Ошибка)
        (error) => {
            console.error('❌ Ошибка загрузки:', error);
            loaderDiv.innerHTML = `
                <div style="color: #d32f2f; text-align: center;">
                    ❌ Ошибка загрузки<br>
                    <small style="color: #666;">Проверьте путь к файлу</small>
                </div>`;
            loaderDiv.style.background = 'rgba(255, 240, 240, 0.95)';
        }
    );

    // 4. Анимация (Loop)
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    function onResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);
    
    // Вызов onResize сразу на случай, если контейнер изменился
    onResize();
}

// Функция центрирования камеры на объекте
function fitCameraToObject(camera, object, controls, offset = 1.25) {
    // 1. Вычисляем Bounding Box
    const boundingBox = new THREE.Box3().setFromObject(object);

    // 2. Находим центр и размер
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // 3. Самая длинная сторона
    const maxDim = Math.max(size.x, size.y, size.z);

    // 4. Центрируем модель в (0, 0, 0)
    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;

    // 5. Вычисляем дистанцию камеры
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= offset;

    // 6. Позиционируем камеру
    camera.position.set(0, maxDim * 0.3, cameraZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    // 7. Обновляем контроллеры
    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    console.log("📍 Камера настроена: z =", cameraZ.toFixed(2));

    //Новый текст для пула
}