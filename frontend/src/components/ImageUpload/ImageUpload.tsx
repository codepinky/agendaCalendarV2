import { useState, useRef } from 'react';
import { Form } from 'react-bootstrap';
import Button from '../shared/Button/Button';
import './ImageUpload.css';

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  maxSizeMB?: number;
  accept?: string;
  helpText?: string;
}

const ImageUpload = ({
  label,
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  maxSizeMB = 5,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  helpText,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Imagem muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Chamar callback
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-container">
      <Form.Label>{label}</Form.Label>
      
      <div className="image-upload-preview-container">
        {preview ? (
          <div className="image-upload-preview">
            <img src={preview} alt="Preview" />
            <div className="image-upload-actions">
              <Button size="sm" variant="secondary" onClick={handleClick}>
                Trocar
              </Button>
              {onImageRemove && (
                <Button size="sm" variant="danger" onClick={handleRemove}>
                  Remover
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="image-upload-placeholder" onClick={handleClick}>
            <div className="image-upload-placeholder-icon">📷</div>
            <p>Clique para selecionar uma imagem</p>
            <p className="text-muted small">JPG, PNG ou WEBP (máx {maxSizeMB}MB)</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {error && <div className="text-danger small mt-2">{error}</div>}
      {helpText && !error && <Form.Text className="text-muted">{helpText}</Form.Text>}
    </div>
  );
};

export default ImageUpload;





