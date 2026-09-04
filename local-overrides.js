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
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'CrossPoint EPUB Optimizer for X3 and X4';
    document.body.classList.add('optimizer-only');

    const heading = document.querySelector('h1');
    if (heading) heading.textContent = 'CrossPoint EPUB Optimizer';

    const fileManagerCard = document.getElementById('file-table')?.closest('.card');
    if (fileManagerCard) fileManagerCard.style.display = 'none';

    const optimizer = document.getElementById('uploadModal');
    optimizer.classList.add('open', 'inline-optimizer');

    const footer = Array.from(document.querySelectorAll('.card')).find(card =>
      card.textContent.includes('Unofficial standalone adaptation')
    );
    if (footer) optimizer.insertAdjacentElement('afterend', footer);

    const modalHeading = document.querySelector('#uploadModal h3');
    if (modalHeading) modalHeading.textContent = '📖 Optimize EPUB locally';

    const pathInfo = document.querySelector('#uploadModal .file-info');
    if (pathInfo) {
      // Keep this upstream-owned element: openUploadModal() writes to it.
      pathInfo.innerHTML = 'Select one or more EPUB files. Processing stays in this browser and the optimized files are downloaded.<strong id="uploadPathDisplay" hidden></strong>';
    }

    const actionButton = document.getElementById('uploadBtn');
    if (actionButton) actionButton.textContent = 'Optimize & Download';

    const originalToggle = window.toggleConvertOptions;
    window.toggleConvertOptions = function toggleConvertOptionsLocally() {
      const checkbox = document.getElementById('convertBeforeUpload');
      checkbox.checked = true;
      originalToggle();
      document.getElementById('convertWarning').style.display = 'none';
      document.getElementById('uploadBtn').textContent = 'Optimize & Download';
      document.getElementById('startConversionBtn').textContent = 'Optimize & Download';
    };

    const optimizeCheckbox = document.getElementById('convertBeforeUpload');
    restoreUploadSettingsFromStorage();
    optimizeCheckbox.checked = true;
    optimizeCheckbox.disabled = true;

    document.getElementById('convertOptions').style.display = 'block';
    toggleConvertOptions();

    document.getElementById('advancedSettingsContent').classList.add('visible');
    document.getElementById('advancedOptionsArrow').classList.add('expanded');
  });
})();
