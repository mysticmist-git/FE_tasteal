import { useState } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Grid,
  Typography,
  Stack,
  TextFieldProps,
} from '@mui/material';
import useFirebaseImage from '@/lib/hooks/useFirebaseImage';
import { AccountEntity } from '@/lib/models/entities/AccountEntity/AccountEntity';
import { storage } from '@/lib/firebase/config';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import AccountService from '@/lib/services/accountService';
import useSnackbarService from '@/lib/hooks/useSnackbar';

const UserEditForm = ({
  file,
  handleFile,
  isEditing,
  onClose,
  userData,
  handleChangeUserData,
}: {
  file: File | undefined;
  handleFile: (file: File | undefined) => void;
  isEditing: boolean;
  onClose: () => void;
  userData: AccountEntity;
  handleChangeUserData: (data: AccountEntity) => void;
}) => {
  const [editData, setEditData] = useState<AccountEntity>(userData);

  const image = useFirebaseImage(userData?.avatar);
  const [snackbarAlert] = useSnackbarService();

  console.log(editData);

  const handleSave = async () => {
    try {
      const updateData = {
        ...editData,
      };
      if (file) {
        if (editData.avatar && editData.avatar.includes('Avatar/')) {
          deleteObject(ref(storage, editData.avatar)).then(async () => {
            const storageRef = ref(storage, `${editData.avatar}`);
            await uploadBytes(storageRef, file);
          });
        } else {
          const storageRef = ref(storage, `Avatar/${editData.uid}`);
          await uploadBytes(storageRef, file).then((snapshot) => {
            updateData.avatar = snapshot.metadata.fullPath;
          });
        }
      }

      const result = await AccountService.UpdateUser(updateData);
      if (result) {
        handleChangeUserData(editData);
        snackbarAlert('Cập nhật thành công', 'success');
      } else {
        snackbarAlert('Cập nhật thất bại', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  console.log(file);

  return (
    <Dialog
      open={isEditing}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: '1000px',
          borderRadius: '24px',
          py: 2,
        },
      }}
    >
      <DialogTitle>
        <Typography
          variant="body1"
          fontWeight={900}
          sx={{
            width: '100%',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Chỉnh sửa thông tin
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid
          container
          spacing={2}
          justifyContent={'center'}
          alignItems={'stretch'}
        >
          <Grid item xs={12} md={5}>
            <label htmlFor="upload-image-input">
              <Box
                component={'img'}
                src={file ? URL.createObjectURL(file) : image}
                alt="Hình ảnh hiện tại"
                sx={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e)}
                style={{ display: 'none' }}
                id="upload-image-input"
              />
            </label>
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack
              spacing={3}
              direction={'column'}
              sx={{
                py: 1,
              }}
            >
              <CustomTextField
                label="Slogan"
                value={editData.slogan}
                onChange={(e) =>
                  setEditData({ ...editData, slogan: e.target.value })
                }
              />

              <CustomTextField
                label="Tên"
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />

              <CustomTextField
                label="Giới thiệu"
                multiline
                rows={3}
                value={editData.introduction}
                onChange={(e) =>
                  setEditData({ ...editData, introduction: e.target.value })
                }
              />

              <CustomTextField
                label="Quote"
                value={editData.quote}
                onChange={(e) =>
                  setEditData({ ...editData, quote: e.target.value })
                }
              />

              <CustomTextField
                label="Website"
                value={editData.link}
                onChange={(e) =>
                  setEditData({ ...editData, link: e.target.value })
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} variant="contained" color="primary">
          Lưu lại
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ backgroundColor: 'white', color: 'black' }}
        >
          Hủy bỏ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditForm;

function CustomTextField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      fullWidth
      multiline
      InputProps={{
        ...props.InputProps,
        sx: {
          borderRadius: 2,
          fontSize: 'body2.fontSize',
          ...props.InputProps?.sx,
        },
      }}
    />
  );
}
