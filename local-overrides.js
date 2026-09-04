// Local adapter for CrossPoint's embedded File Transfer page.
// The upstream optimizer stays in index.html; only its upload destination changes.
(function () {
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function optimizedFilename(filename) {
    return filename.replace(/\.epub$/i, '') + '-optimized.epub';
  }

  window.uploadFile = async function uploadFileLocally() {
    if (isUploadInProgress) return;

    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);
    const convertEnabled = document.getElementById('convertBeforeUpload').checked;

    if (files.length === 0) {
      alert('Please select at least one EPUB.');
      return;
    }
    if (!convertEnabled) {
      alert('Enable “Optimize EPUB” first.');
      return;
    }

    isUploadInProgress = true;
    operationCancelled = false;
    document.getElementById('uploadModalClose').classList.add('disabled');
    fileInput.disabled = true;

    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const actionButton = document.getElementById('uploadBtn');
    progressContainer.style.display = 'block';
    actionButton.disabled = true;
    const cancelButton = document.getElementById('localCancelButton');
    if (cancelButton) cancelButton.style.display = 'block';

    try {
      for (let index = 0; index < files.length; index++) {
        if (operationCancelled) throw new Error('Cancelled by user');

        let file = files[index];
        if (!file.name.toLowerCase().endsWith('.epub')) continue;

        if (document.getElementById('renameFromMetadataToggle').checked) {
          file = await maybeRenameEbookFile(file);
        }

        progressFill.style.width = '0%';
        progressFill.style.backgroundColor = '#9b59b6';
        progressText.textContent = `Optimizing ${file.name} (${index + 1}/${files.length})…`;

        const convertedBlob = await convertEpubFile(file, percent => {
          progressFill.style.width = percent + '%';
        });

        downloadBlob(convertedBlob, optimizedFilename(file.name));
        progressFill.style.width = '100%';
        progressFill.style.backgroundColor = '#27ae60';
        progressText.textContent = `Downloaded ${optimizedFilename(file.name)} (${index + 1}/${files.length})`;
      }
    } catch (error) {
      if (!operationCancelled) {
        console.error('Local conversion error:', error);
        logError(`Conversion failed: ${error.message}`);
        progressFill.style.backgroundColor = '#e74c3c';
        progressText.textContent = `Conversion failed: ${error.message}`;
      }
    } finally {
      isUploadInProgress = false;
      document.getElementById('uploadModalClose').classList.remove('disabled');
      fileInput.disabled = false;
      actionButton.disabled = false;
      if (cancelButton) cancelButton.style.display = 'none';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'CrossPoint EPUB Optimizer';
    document.body.classList.add('standalone-page');

    const heading = document.querySelector('h1');
    if (heading) {
      heading.textContent = 'Optimize EPUBs for CrossPoint';
      heading.insertAdjacentHTML('beforebegin', '<span class="standalone-kicker">CrossPoint Reader utility</span>');
      heading.insertAdjacentHTML('afterend', `
        <p class="standalone-intro">Resize images and prepare EPUB files for CrossPoint X3 and X4 readers. Processing happens in this browser.</p>
        <p class="standalone-meta">EPUB in&nbsp;&nbsp;/&nbsp;&nbsp;optimized EPUB out</p>
      `);
    }

    const deviceNavigation = document.querySelector('.nav-links');
    if (deviceNavigation) deviceNavigation.style.display = 'none';

    const fileManagerHeader = document.querySelector('.page-header');
    if (fileManagerHeader) fileManagerHeader.style.display = 'none';

    const failedUploads = document.getElementById('failedUploadsBanner');
    if (failedUploads) failedUploads.style.display = 'none';

    const fileManagerCard = document.getElementById('file-table')?.closest('.card');
    if (fileManagerCard) fileManagerCard.style.display = 'none';

    const optimizer = document.getElementById('uploadModal');
    optimizer.classList.add('open', 'standalone-optimizer');

    const footerCard = Array.from(document.querySelectorAll('.card')).find(card =>
      card.textContent.includes('Unofficial standalone adaptation')
    );
    if (footerCard) {
      footerCard.classList.add('standalone-footer');
      optimizer.insertAdjacentElement('afterend', footerCard);
    }

    const modalHeading = document.querySelector('#uploadModal h3');
    if (modalHeading) modalHeading.textContent = 'Choose your books';

    const pathInfo = document.querySelector('#uploadModal .file-info');
    if (pathInfo) {
      // Keep the hidden upstream element because the original modal helper references it.
      pathInfo.innerHTML = 'Select one or more EPUB files. Each optimized copy downloads when it is ready.<strong id="uploadPathDisplay" hidden></strong>';
    }

    const fileInput = document.getElementById('fileInput');
    fileInput.accept = '.epub,application/epub+zip';
    document.querySelector('.drop-zone-hint').textContent = 'Drop EPUB files here or choose files';

    const originalToggle = window.toggleConvertOptions;
    window.toggleConvertOptions = function toggleConvertOptionsLocally() {
      const checkbox = document.getElementById('convertBeforeUpload');
      if (checkbox.dataset.alwaysEnabled === 'true') checkbox.checked = true;
      originalToggle();
      document.getElementById('uploadBtn').textContent = 'Optimize & Download';
      document.getElementById('startConversionBtn').textContent = 'Optimize & Download';
    };

    const optimizeCheckbox = document.getElementById('convertBeforeUpload');
    optimizeCheckbox.dataset.alwaysEnabled = 'true';
    optimizeCheckbox.checked = true;
    optimizeCheckbox.disabled = true;
    restoreUploadSettingsFromStorage();
    optimizeCheckbox.checked = true;
    optimizeCheckbox.closest('label').querySelector('span').textContent = 'Output settings';

    const advancedToggle = document.getElementById('advancedOptionsToggle');
    advancedToggle.setAttribute('role', 'button');
    advancedToggle.setAttribute('tabindex', '0');
    advancedToggle.setAttribute('aria-controls', 'advancedSettingsContent');
    advancedToggle.setAttribute('aria-expanded', 'false');
    advancedToggle.querySelector('.advanced-options-text').textContent = 'Adjust options';
    advancedToggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        advancedToggle.click();
      }
    });
    advancedToggle.addEventListener('click', () => {
      requestAnimationFrame(() => {
        advancedToggle.setAttribute(
          'aria-expanded',
          document.getElementById('advancedSettingsContent').classList.contains('visible') ? 'true' : 'false'
        );
      });
    });

    const advancedSettings = document.getElementById('advancedSettingsContent');
    const renameSetting = document.getElementById('renameFromMetadataToggle')?.closest('.advanced-setting-row');
    if (renameSetting) advancedSettings.prepend(renameSetting);

    document.getElementById('convertSettings').innerHTML = `
      <span>Grayscale images</span>
      <span id="convertSizeSummary">Max 480 x 800 px</span>
      <span>85% JPEG</span>
      <span>SVG fixes</span>
    `;

    const settingLabels = [
      ['renameFromMetadataToggle', 'Rename from book metadata'],
      ['autoCropToggle', 'Auto-crop margins'],
      ['export-log-checkbox', 'Automatically download the conversion log'],
      ['rememberUploadSettings', 'Remember settings in this browser']
    ];
    settingLabels.forEach(([id, label]) => {
      document.getElementById(id)?.setAttribute('aria-label', label);
    });

    document.querySelector('.quality-row .setting-title').textContent = 'JPEG quality';
    document.querySelector('#deviceSettingRow .setting-title').textContent = 'Target device';
    document.querySelector('#rotationSettingRow .setting-title').textContent = 'Rotation direction';
    document.querySelector('#overlapSettingRow .setting-title').textContent = 'Minimum overlap';
    document.getElementById('autoCropToggle').closest('.advanced-setting-row').querySelector('.setting-title').textContent = 'Auto-crop margins';
    document.querySelector('#log-section .log-title').textContent = 'Conversion log';

    document.getElementById('progress-container').setAttribute('role', 'status');
    document.getElementById('progress-container').setAttribute('aria-live', 'polite');

    document.getElementById('convertOptions').style.display = 'block';
    toggleConvertOptions();

    const actionButton = document.getElementById('uploadBtn');
    actionButton.textContent = 'Optimize & Download';

    const startButton = document.getElementById('startConversionBtn');
    startButton.textContent = 'Optimize & Download';

    const cancelButton = document.querySelector('#uploadModal .delete-btn-cancel');
    cancelButton.id = 'localCancelButton';
    cancelButton.textContent = 'Cancel optimization';
    cancelButton.style.display = 'none';
  });
})();
