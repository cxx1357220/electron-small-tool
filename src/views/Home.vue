<template>
  <div class="home">
    <el-row>
      <el-col :span="14" class="left-side">
        <div class="file-box">
          <el-card v-for="(file, idx) in files" class="file-list">
            <label>{{ file.name }}</label>
            <p></p>
            <el-checkbox v-if="file.type=='json'" :disabled="loading||!!file.status" v-model="file.checked"
              >带表格格式json</el-checkbox
            >
            <span>
              <el-progress
                :percentage="file.progress"
                :status="file.status"
              ></el-progress>
            </span>
            <span class="error" v-show="file.error">{{ file.error }}</span>
            <div
              class="path"
              title="打开路径"
              v-show="file.newFilePath"
              @click="openFinder(file.newFilePath, 'file')"
            >
              {{ file.newFilePath }}
            </div>
            <i
              class="el-icon-close"
              v-show="!loading"
              @click="delList(idx)"
            ></i>
          </el-card>
        </div>
        <el-button
          class="add-file el-icon-plus"
          :disabled="loading"
          :loading="loading"
          @click="openFile"
          >{{ loading ? "转换中" : "添加文件" }}</el-button
        >
      </el-col>
      <el-col :span="10" class="right-side">
        <el-input
          size="mini"
          v-model="path"
          readonly
          placeholder="转换输出路径"
        ></el-input>
        <div class="buttonList">
          <el-button
            size="mini"
            @click="setPath"
            :disabled="loading"
            icon="el-icon-folder"
            >选择输出路径</el-button
          >
          <el-button
            size="mini"
            @click="exportFile"
            type="primary"
            :loading="loading"
            :disabled="lock || !path"
            icon="el-icon-document-copy"
            >转换</el-button
          >
          <el-button
            size="mini"
            @click="openFinder(path)"
            :disabled="!path"
            icon="el-icon-folder-opened"
            >打开路径</el-button
          >
        </div>

        <div class="file-box">
          <el-card
            v-for="(file, idx) in doneFiles"
            class="file-list"
            shadow="hover"
          >
            <i
              class="el-icon-delete"
              @click="delFile(file.newFilePath, idx)"
              title="删除文件"
            ></i>
            <label>{{ file.newName }}</label>
            <div
              class="path"
              title="打开路径"
              @click="openFinder(file.newFilePath, 'file')"
            >
              {{ file.newFilePath }}
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <footer></footer>
    <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";
const electron = window.require("electron");
const fs = window.require("fs");
// import { electron } from 'electron'
// if (window.require) {
//   const electron = window.require("electron");
//   const ipc = window.require("electron").ipcRenderer;
//   console.log(electron);
// }
const ipc = electron.ipcRenderer;

export default {
  name: "home",
  components: {
    HelloWorld,
  },
  data() {
    return {
      path: "/Users/chenxihua/Desktop/eletron测试",
      files: [],
      doneFiles: [],
      loading: false,
      doneCount: 0,
      lock: false,
      errorCount: 0, //错误数量
      // img:require('../assets/logo.png')
    };
  },
  methods: {
    openFile() {
      ipc.send("open-directory-dialog", "xlsx");
      if (this.lock) {
        this.lock = false;
        this.files = [];
      }
    },
    openFinder(path, file) {
      console.log(path);
      // window.shell = electron.shell;
      let callBack = ipc.sendSync("hasPath", path); //同步判断是否存在文件夹，build:mac后showItemInFolder无返回值。。。shell别的方法都有返回值，无语了。
      if (!callBack) {
        if (!file) {
          this.$message("找不到此文件夹");
        } else {
          this.$message("找不到此文件");
        }
      } else {
        // let callBack = electron.shell.showItemInFolder(path);
        // console.log(callBack); //build:mac后无返回值。。。
        electron.shell.showItemInFolder(path);
      }
    },
    setPath() {
      ipc.send("open-path-dialog");
    },
    exportFile() {
      this.loading = true;
      this.lock = true;
      ipc.send(
        "export",
        this.files,
        this.path,
        navigator.platform.indexOf("Mac") !== -1
      );
    },
    delList(idx) {
      this.files.splice(idx, 1);
    },
    delFile(path, idx) {
      // let callBack = electron.shell.moveItemToTrash(path);
      fs.unlink(path,(err)=>{
        console.log('err: ', err);
        if(err){
          this.$message(err.toString());
        }else{
          this.$message("删除成功");
          this.doneFiles.splice(idx, 1);
        }
      })
      // if (callBack) {
      //   this.$message("删除成功");
      //   this.doneFiles.splice(idx, 1);
      // } else {
      //   this.$message("找不到该文件");
      // }
    },
  },
  created() {
    this.path = localStorage.getItem("path") || "";
    ipc.on("path", (event, path) => {
      if (path) {
        this.path = path;
        localStorage.setItem("path", path);
      }
    });
    ipc.on("files", (event, files) => {
      if (files) {
        let newFileList = files.map((a) => {
          this.files = this.files.filter((obj) => obj.path !== a);
          let arr;
          if (navigator.platform.indexOf("Mac") !== -1) {
            //mac路径为/windows路径为\
            arr = a.split("/");
          } else {
            arr = a.split("\\");
          }
          let name = arr[arr.length - 1];
          let fileName = name.split('.'),
          type = fileName[fileName.length - 1].toLocaleLowerCase()
          return {
            path: a,
            name: name,
            type:type
          };
        });
        this.files = this.files.concat(newFileList);
      }
    });

    ipc.on("console.log", (event, log) => {
      console.log(log);
    });

    ipc.on("files-progress", (event, i, val, newNameObj) => {
      const done = () => {
        this.doneCount++;
        if (this.doneCount == this.files.length) {
          if (this.errorCount) {
            this.$message({
              message: "转换完毕," + this.errorCount + "条错误。",
              type: "warning",
            });
          } else {
            this.$message({ message: "转换完毕", type: "success" });
          }
          let newFiles = this.files.filter((obj) => obj.newFilePath);
          this.doneFiles = this.doneFiles.filter((obj) => {
            return (
              newFiles.findIndex(
                (item) => item.newFilePath == obj.newFilePath
              ) == -1
            );
          });
          this.doneFiles = newFiles.concat(this.doneFiles);
          // let message =
          //     "转换完毕" +
          //     (this.errorCount ? "," + this.errorCount + "条错误。" : ""),
          //   type = this.errorCount ? "warning" : "success";

          this.loading = false;
          this.doneCount = 0;
          this.errorCount = 0;
        }
      };
      if (this.files[i]) {
        if (val == "error") {
          this.errorCount++;
          this.$set(this.files[i], "status", "exception");
          Object.assign(this.files[i], newNameObj);
          done();
        }else if(val=='log'){
          console.log(newNameObj)
        } else {
          this.$set(this.files[i], "progress", val);
          if (val == 100) {
            this.$set(this.files[i], "status", "success");
            Object.assign(this.files[i], newNameObj);
            done();
          }
        }
      }
    });
  },
};
</script>


<style lang="less" scoped>
.left-side {
  text-align: center;
  height: 100vh;
  border-right: 1px solid #eee;
  padding: 15px 0 15px 15px;
  word-wrap: break-word;
  .add-file {
    margin: 10px;
  }
  .file-box {
    padding-right: 15px;
    max-height: calc(100vh - 80px);
    overflow: scroll;
  }
  .file-list {
    text-align: left;
    margin: 0 0 5px 0;
    .path {
      color: #409eff;
      font-size: 12px;
      cursor: pointer;
    }
    & /deep/.el-card__body {
      // display: flex;
      position: relative;
      & > i {
        position: absolute;
        right: 10px;
        top: 10px;
      }
      & > i:hover {
        color: red;
      }
      .error {
        color: #f56c6c;
        font-size: 12px;
      }
      & > label,
      & > div {
      }
      & > span {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        & > div {
          width: 100%;
        }
      }
    }
  }
}
.right-side {
  padding: 10px;
  word-wrap: break-word;
  i {
    position: absolute;
    right: 10px;
  }
  & > .buttonList {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 5px;
  }
  .file-box {
    margin-top: 20px;
    max-height: calc(100vh - 102px);
    overflow-y: scroll;
  }
  .file-list {
    margin: 5px 0 0 0;
    position: relative;
    .path {
      color: #409eff;
      font-size: 12px;
      cursor: pointer;
    }

    & /deep/.el-card__body {
      // display: flex;
      position: relative;
      padding:10px & > i {
        position: absolute;
        right: 10px;
        top: 10px;
      }
      & > i:hover {
        color: red;
      }
      & > span {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        & > div {
          width: 100%;
        }
      }
    }
  }
}
</style>
